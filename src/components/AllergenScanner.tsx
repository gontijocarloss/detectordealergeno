import React, { useState, useCallback, useRef } from 'react';
import Webcam from 'react-webcam';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, X, Camera, AlertTriangle, Info, ShieldCheck } from 'lucide-react';
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/library';
import ProductInfo from './ProductInfo';
import { processImageForBarcode } from '@/lib/imageProcessing';

// Alérgenos mais comuns no Brasil (RDC 26/2015 - ANVISA)
const ALLERGEN_SUGGESTIONS = [
  'leite', 'ovo', 'amendoim', 'soja', 'trigo', 'glúten',
  'peixe', 'crustáceo', 'castanha', 'nozes', 'lactose',
];

/**
 * Normaliza uma string: minúsculas + remove acentos.
 * Garante que "leite", "Leite" e "léite" sejam comparados igualmente.
 */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Motor de comparação multidimensional unificado (TCC cap. 5.5).
 * Exportado para uso no ProductInfo, evitando divergências de resultado.
 *
 * Camadas verificadas:
 *   1. ingredients_text — texto livre de ingredientes
 *   2. allergens        — campo de alérgenos do produto
 *   3. allergens_tags   — tags estruturadas de alérgenos
 *   4. traces_tags      — tags de traços (pode conter o alérgeno)
 */
export function detectAllergens(userAllergens: string[], product: any): string[] {
  const ingredientsText = normalize(product.ingredients_text || '');
  const allergensField  = normalize(product.allergens        || '');
  const allergensTags   = normalize(
    (product.allergens_tags || []).join(' ').replace(/en:/g, '').replace(/-/g, ' ')
  );
  const tracesTags = normalize(
    (product.traces_tags || []).join(' ').replace(/en:/g, '').replace(/-/g, ' ')
  );

  return userAllergens.filter((raw) => {
    const a = normalize(raw);
    if (!a) return false;
    return (
      ingredientsText.includes(a) ||
      allergensField.includes(a)  ||
      allergensTags.includes(a)   ||
      tracesTags.includes(a)
    );
  });
}

const AllergenScanner = () => {
  const [isScanning, setIsScanning]         = useState(false);
  const [allergens, setAllergens]           = useState('');
  const [showAlert, setShowAlert]           = useState(false);
  const [foundAllergens, setFoundAllergens] = useState<string[]>([]);
  const [productInfo, setProductInfo]       = useState<any>(null);
  const [scanProgress, setScanProgress]     = useState('');
  const [cameraError, setCameraError]       = useState(false);
  const webcamRef     = useRef<Webcam>(null);
  const { toast }     = useToast();
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  const getCodeReader = useCallback(() => {
    if (!codeReaderRef.current) {
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13, BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,  BarcodeFormat.UPC_E,
        BarcodeFormat.CODE_128, BarcodeFormat.CODE_39, BarcodeFormat.ITF,
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);
      codeReaderRef.current = new BrowserMultiFormatReader(hints);
    }
    return codeReaderRef.current;
  }, []);

  const tryDecodeImage = async (imageUrl: string): Promise<string | null> => {
    try {
      const result = await getCodeReader().decodeFromImageUrl(imageUrl);
      return result?.getText() || null;
    } catch {
      return null;
    }
  };

  const fetchProduct = async (barcode: string) => {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      { headers: { 'User-Agent': 'AllergenDetector-TCC/1.0 (ifma.edu.br)' } }
    );
    return await response.json();
  };

  const addSuggestion = (suggestion: string) => {
    const current = allergens
      .split(',')
      .map((a) => a.trim())
      .filter((a) => a);
    if (!current.includes(suggestion)) {
      setAllergens([...current, suggestion].join(', '));
    }
  };

  const capture = useCallback(async () => {
    if (!webcamRef.current) return;

    setIsScanning(true);
    setProductInfo(null);
    setFoundAllergens([]);
    setScanProgress('Capturando imagem...');

    const imageSrc = webcamRef.current.getScreenshot();

    if (!imageSrc) {
      toast({
        variant: 'destructive',
        title: 'Erro na captura',
        description: 'Não foi possível capturar a imagem. Verifique se a câmera está ativa.',
      });
      setIsScanning(false);
      setScanProgress('');
      return;
    }

    try {
      setScanProgress('Processando imagem...');
      const processedImages = await processImageForBarcode(imageSrc);
      let barcode: string | null = null;

      for (let i = 0; i < processedImages.length; i++) {
        setScanProgress(`Tentando detecção ${i + 1}/${processedImages.length}...`);
        barcode = await tryDecodeImage(processedImages[i]);
        if (barcode) break;
      }

      if (!barcode) {
        toast({
          variant: 'destructive',
          title: 'Código não detectado',
          description: 'Centralize o código de barras na área destacada e garanta boa iluminação.',
        });
        setIsScanning(false);
        setScanProgress('');
        return;
      }

      setScanProgress('Consultando Open Food Facts...');
      const productData = await fetchProduct(barcode);

      if (productData.status === 1) {
        const product = productData.product;
        setProductInfo(product);

        const userAllergens = allergens
          .split(',')
          .map((a) => a.trim())
          .filter((a) => a);

        // Motor de comparação unificado — mesma função usada pelo ProductInfo
        const detected = detectAllergens(userAllergens, product);

        if (detected.length > 0) {
          setFoundAllergens(detected);
          setShowAlert(true);
        } else {
          // ── Notificação de conformidade aprimorada ──
          toast({
            title: '✅ Produto Seguro',
            description: `Nenhum dos seus alérgenos (${userAllergens.join(', ')}) foi encontrado neste produto. Verifique também a embalagem antes do consumo.`,
            duration: 6000,
          });
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Produto não encontrado',
          description: `Código ${barcode} não está cadastrado na base Open Food Facts.`,
        });
      }
    } catch (error) {
      console.error('Erro ao processar:', error);
      toast({
        variant: 'destructive',
        title: 'Erro de conexão',
        description: 'Não foi possível consultar a base de dados. Verifique sua conexão.',
      });
    } finally {
      setIsScanning(false);
      setScanProgress('');
    }
  }, [allergens, toast, getCodeReader]);

  const userAllergensList = allergens
    .split(',')
    .map((a) => a.trim())
    .filter((a) => a);

  return (
    <section id="scanner" className="flex flex-col items-center gap-6 max-w-2xl mx-auto px-4 py-10">
      {/* Título */}
      <div className="text-center">
        <h2 className="text-2xl font-bold">Scanner de Alérgenos</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Escaneie o código de barras do produto para verificar os alérgenos
        </p>
      </div>

      {/* Configuração de alérgenos */}
      <div className="w-full space-y-3">
        <label className="text-sm font-medium">
          Seus alérgenos{' '}
          <span className="text-muted-foreground font-normal">(separados por vírgula)</span>
        </label>
        <Input
          placeholder="Ex: leite, glúten, amendoim"
          value={allergens}
          onChange={(e) => setAllergens(e.target.value)}
          className="w-full"
        />

        {/* Sugestões rápidas (RDC 26/2015) */}
        <div className="flex flex-wrap gap-2">
          {ALLERGEN_SUGGESTIONS.map((s) => {
            const active = userAllergensList.map(a => a.toLowerCase()).includes(s);
            return (
              <button
                key={s}
                onClick={() => addSuggestion(s)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  active
                    ? 'bg-black text-white border-black'
                    : 'bg-background border-border hover:border-black/40'
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>

        {/* Aviso ANVISA */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border">
          <Info className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground">
            Os alérgenos acima seguem a Resolução RDC nº 26/2015 da ANVISA — lista obrigatória
            de declaração nos rótulos de alimentos no Brasil.
          </p>
        </div>
      </div>

      {/* Câmera */}
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
        {cameraError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/60 gap-2 p-4 text-center">
            <Camera className="w-10 h-10 opacity-40" />
            <p className="text-sm">Câmera não disponível</p>
            <p className="text-xs">Verifique as permissões de câmera no navegador</p>
          </div>
        ) : (
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            screenshotQuality={0.95}
            className="w-full h-full object-cover"
            onUserMediaError={() => setCameraError(true)}
            videoConstraints={{
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: 'environment',
              aspectRatio: 16 / 9,
            }}
          />
        )}

        {/* Guia de posicionamento */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-3/4 h-20 border-2 border-dashed border-white/50 rounded-lg flex items-center justify-center">
            <span className="text-white/70 text-xs bg-black/50 px-2 py-1 rounded">
              Posicione o código de barras aqui
            </span>
          </div>
          <div className="absolute top-1/2 left-[12.5%] -translate-y-1/2 w-4 h-4 border-l-2 border-t-2 border-white/60 rounded-tl" />
          <div className="absolute top-1/2 right-[12.5%] -translate-y-1/2 w-4 h-4 border-r-2 border-t-2 border-white/60 rounded-tr" />
        </div>

        {/* Progresso */}
        {isScanning && scanProgress && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center">
            <div className="bg-black/80 px-4 py-2 rounded-full flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin text-white" />
              <span className="text-xs text-white">{scanProgress}</span>
            </div>
          </div>
        )}
      </div>

      {/* Botão */}
      <Button
        onClick={capture}
        disabled={isScanning || !allergens.trim() || cameraError}
        className="w-full"
        size="lg"
      >
        {isScanning ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Analisando produto...
          </>
        ) : (
          <>
            <Camera className="mr-2 h-4 w-4" />
            Escanear Produto
          </>
        )}
      </Button>

      {!allergens.trim() && (
        <p className="text-xs text-muted-foreground text-center -mt-2">
          ⚠️ Configure seus alérgenos antes de escanear
        </p>
      )}

      {/* Resultado do produto */}
      {productInfo && (
        <div className="w-full relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 z-10"
            onClick={() => setProductInfo(null)}
          >
            <X className="h-4 w-4" />
          </Button>
          <ProductInfo product={productInfo} userAllergens={userAllergensList} />
        </div>
      )}

      {/* ══════════════════════════════════════
          Dialog de Alerta — Alérgeno Detectado
          ══════════════════════════════════════ */}
      <Dialog open={showAlert} onOpenChange={setShowAlert}>
        <DialogContent className="max-w-sm p-0 overflow-hidden border-0 shadow-2xl rounded-2xl">

          {/* Faixa vermelha de cabeçalho */}
          <div className="bg-red-600 px-5 pt-5 pb-4">
            <DialogHeader>
              <div className="flex items-center gap-3">
                {/* Ícone circular */}
                <div className="flex items-center justify-center w-11 h-11 rounded-full bg-white/20 shrink-0 ring-2 ring-white/30">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-white text-lg font-bold leading-tight">
                    Alérgeno Detectado!
                  </DialogTitle>
                  <p className="text-red-100 text-sm mt-0.5 font-medium">
                    Este produto NÃO é seguro para você
                  </p>
                </div>
              </div>
            </DialogHeader>
          </div>

          {/* Corpo do dialog */}
          <div className="px-5 py-4 space-y-4 bg-white dark:bg-background">

            <p className="text-sm text-foreground font-medium">
              Foram identificados os seguintes alérgenos do seu perfil:
            </p>

            {/* Chips dos alérgenos detectados */}
            <div className="flex flex-wrap gap-2">
              {foundAllergens.map((a) => (
                <span
                  key={a}
                  className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 border-2 border-red-300 text-sm px-3 py-1.5 rounded-full font-bold capitalize shadow-sm"
                >
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  {a}
                </span>
              ))}
            </div>

            {/* Aviso de confirmação */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200">
              <Info className="h-4 w-4 mt-0.5 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-800 leading-relaxed">
                Confirme sempre as informações na embalagem do produto antes do consumo.
                Os dados são fornecidos pela base colaborativa Open Food Facts.
              </p>
            </div>

            {/* Botão de fechar */}
            <Button
              className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold h-11 rounded-xl shadow"
              onClick={() => setShowAlert(false)}
            >
              Entendi — Não vou consumir este produto
            </Button>
          </div>

        </DialogContent>
      </Dialog>
    </section>
  );
};

export default AllergenScanner;
