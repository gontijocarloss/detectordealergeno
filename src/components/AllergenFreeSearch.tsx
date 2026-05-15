import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, ExternalLink, AlertTriangle, ShieldCheck, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Product {
  code: string;
  product_name?: string;
  brands?: string;
  ingredients_text?: string;
  nutrition_grade_fr?: string;
  categories?: string;
  countries?: string;
  nova_group?: number;
  image_url?: string;
  allergens?: string;
  allergens_tags?: string[];
}

// Verificação multidimensional (3 camadas — alinhada ao cap. 5.5 do TCC)
function isAllergenFree(product: Product, allergenList: string[]): boolean {
  const ingredients = (product.ingredients_text || '').toLowerCase();
  const allergens = (product.allergens || '').toLowerCase();
  const tags = (product.allergens_tags || []).join(' ').toLowerCase();

  return !allergenList.some(
    (a) => ingredients.includes(a) || allergens.includes(a) || tags.includes(a)
  );
}

const NUTRI_COLORS: Record<string, string> = {
  a: 'bg-green-600',
  b: 'bg-lime-500',
  c: 'bg-yellow-500',
  d: 'bg-orange-500',
  e: 'bg-red-600',
};

const NOVA_COLORS: Record<number, string> = {
  1: 'bg-green-600',
  2: 'bg-yellow-500',
  3: 'bg-orange-500',
  4: 'bg-red-600',
};

const NOVA_LABELS: Record<number, string> = {
  1: 'Alimento in natura',
  2: 'Ingrediente culinário',
  3: 'Alimento processado',
  4: 'Ultraprocessado',
};

const AllergenFreeSearch = () => {
  const [productName, setProductName] = useState('');
  const [allergens, setAllergens] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchStatus, setSearchStatus] = useState<'idle' | 'no-results' | 'no-allergen-free' | 'error'>('idle');
  const { toast } = useToast();

  const fetchProducts = async (searchTerm: string): Promise<Product[]> => {
    const params = new URLSearchParams({
      search_terms: searchTerm,
      search_simple: '1',
      action: 'process',
      json: '1',
      page_size: '50',
    });
    const response = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?${params}`,
      { headers: { 'User-Agent': 'AllergenDetector-TCC/1.0 (ifma.edu.br)' } }
    );
    const data = await response.json();
    return data.products || [];
  };

  const handleSearch = async () => {
    if (!productName.trim() || !allergens.trim()) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description: 'Informe o nome do produto e os alérgenos que deseja evitar.',
      });
      return;
    }

    setIsLoading(true);
    setProducts([]);
    setSearchStatus('idle');

    try {
      const allProducts = await fetchProducts(productName.trim());

      if (allProducts.length === 0) {
        setSearchStatus('no-results');
        return;
      }

      const allergenList = allergens
        .toLowerCase()
        .split(',')
        .map((a) => a.trim())
        .filter((a) => a);

      // Usa verificação multidimensional (3 camadas)
      const safe = allProducts.filter((p) => isAllergenFree(p, allergenList));

      if (safe.length === 0) {
        setSearchStatus('no-allergen-free');
        return;
      }

      setProducts(safe.slice(0, 5));
    } catch {
      setSearchStatus('error');
      toast({
        variant: 'destructive',
        title: 'Erro de conexão',
        description: 'Não foi possível conectar ao servidor. Verifique sua conexão.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const allergenList = allergens
    .toLowerCase()
    .split(',')
    .map((a) => a.trim())
    .filter((a) => a);

  return (
    <section id="busca" className="w-full max-w-4xl mx-auto px-4 py-10 space-y-6">
      {/* Cabeçalho */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Buscar Produtos Sem Alérgenos</h2>
        <p className="text-sm text-muted-foreground">
          Encontre produtos que <strong>não contenham</strong> os alérgenos que você informar
        </p>
      </div>

      {/* Formulário */}
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nome do produto</label>
            <Input
              placeholder="Ex: chocolate, iogurte, pão..."
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Alérgenos a evitar</label>
            <Input
              placeholder="Ex: lactose, glúten, soja..."
              value={allergens}
              onChange={(e) => setAllergens(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
        </div>

        <Button
          onClick={handleSearch}
          disabled={isLoading || !productName.trim() || !allergens.trim()}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Buscando produtos...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Buscar Produtos
            </>
          )}
        </Button>

        {/* Aviso */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Os dados são fornecidos pela base colaborativa Open Food Facts e dependem do cadastro
            feito pelos fabricantes. Sempre confirme na embalagem do produto.
          </p>
        </div>
      </div>

      {/* Estados de feedback */}
      {searchStatus === 'no-results' && (
        <div className="text-center py-10 text-muted-foreground">
          <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhum produto encontrado para "{productName}".</p>
          <p className="text-xs mt-1">Tente um termo mais genérico.</p>
        </div>
      )}

      {searchStatus === 'no-allergen-free' && (
        <div className="text-center py-10 text-muted-foreground">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">
            Todos os produtos encontrados contêm:{' '}
            <strong>{allergenList.join(', ')}</strong>
          </p>
          <p className="text-xs mt-1">Tente um produto ou alérgeno diferente.</p>
        </div>
      )}

      {searchStatus === 'error' && (
        <div className="text-center py-10 text-destructive">
          <p className="text-sm">Erro ao conectar ao servidor. Verifique sua conexão e tente novamente.</p>
        </div>
      )}

      {/* Lista de produtos */}
      {products.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-800">
            <ShieldCheck className="h-5 w-5 text-green-600 shrink-0" />
            <p className="text-sm font-medium text-green-800 dark:text-green-400">
              {products.length} produto(s) sem:{' '}
              <span className="font-bold">{allergenList.join(', ')}</span>
            </p>
          </div>

          <div className="grid gap-4">
            {products.map((product) => (
              <Card key={product.code} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base leading-tight">
                        {product.product_name || 'Nome não disponível'}
                      </CardTitle>
                      {product.brands && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {product.brands}
                        </p>
                      )}
                    </div>
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.product_name || 'Produto'}
                        className="w-16 h-16 object-cover rounded-md shrink-0 border"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Badges de segurança + classificações */}
                  <div className="flex flex-wrap gap-1.5">
                    {allergenList.map((a) => (
                      <Badge
                        key={a}
                        variant="outline"
                        className="text-green-700 border-green-400 bg-green-50 text-xs"
                      >
                        ✓ Livre de {a}
                      </Badge>
                    ))}
                    {product.nutrition_grade_fr && (
                      <Badge
                        className={`${NUTRI_COLORS[product.nutrition_grade_fr.toLowerCase()] || 'bg-muted'} text-white text-xs uppercase`}
                      >
                        Nutri-Score {product.nutrition_grade_fr.toUpperCase()}
                      </Badge>
                    )}
                    {product.nova_group && (
                      <Badge
                        className={`${NOVA_COLORS[product.nova_group] || 'bg-muted'} text-white text-xs`}
                        title={NOVA_LABELS[product.nova_group]}
                      >
                        NOVA {product.nova_group}
                      </Badge>
                    )}
                  </div>

                  {/* Ingredientes */}
                  {product.ingredients_text && (
                    <div>
                      <p className="text-xs font-medium mb-1">Ingredientes:</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {product.ingredients_text}
                      </p>
                    </div>
                  )}

                  {/* Detalhes */}
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                    {product.categories && (
                      <span>
                        <span className="font-medium text-foreground">Categoria:</span>{' '}
                        {product.categories.split(',')[0].trim()}
                      </span>
                    )}
                    {product.countries && (
                      <span>
                        <span className="font-medium text-foreground">País:</span>{' '}
                        {product.countries.split(',')[0].trim()}
                      </span>
                    )}
                    <span>
                      <span className="font-medium text-foreground">Código:</span>{' '}
                      {product.code}
                    </span>
                  </div>

                  <a
                    href={`https://world.openfoodfacts.org/product/${product.code}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Ver ficha completa no Open Food Facts
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Nota metodológica */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/40 border border-border">
            <Info className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground">
              A verificação de segurança analisa três camadas de dados: texto de ingredientes,
              campo de alérgenos e etiquetas internacionais padronizadas (allergens_tags).
              Isso minimiza falsos negativos causados por nomenclaturas técnicas ou sinônimos.
            </p>
          </div>
        </div>
      )}
    </section>
  );
};

export default AllergenFreeSearch;
