import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, ShieldCheck, ExternalLink, Leaf, Zap, FlaskConical } from 'lucide-react';
import { detectAllergens } from './AllergenScanner';

interface ProductInfoProps {
  product: any;
  userAllergens?: string[];
}

// ── Nutri-Score ──────────────────────────────────────────────────
const NUTRI_BG: Record<string, string> = {
  a: 'bg-green-600', b: 'bg-lime-500', c: 'bg-yellow-500', d: 'bg-orange-500', e: 'bg-red-600',
};

// ── NOVA ─────────────────────────────────────────────────────────
const NOVA_BG: Record<number, string> = {
  1: 'bg-green-600', 2: 'bg-yellow-500', 3: 'bg-orange-500', 4: 'bg-red-600',
};
const NOVA_LABELS: Record<number, string> = {
  1: 'Alimento in natura ou minimamente processado',
  2: 'Ingrediente culinário processado',
  3: 'Alimento processado',
  4: 'Alimento ultraprocessado',
};

// ── Tabela nutricional ────────────────────────────────────────────
const NUTRIENTS = [
  { key: 'energy_kcal',    label: 'Energia',             unit: 'kcal' },
  { key: 'fat',            label: 'Gorduras totais',      unit: 'g'    },
  { key: 'saturated-fat',  label: 'Gorduras saturadas',   unit: 'g'    },
  { key: 'carbohydrates',  label: 'Carboidratos',         unit: 'g'    },
  { key: 'sugars',         label: 'Açúcares',             unit: 'g'    },
  { key: 'fiber',          label: 'Fibras',               unit: 'g'    },
  { key: 'proteins',       label: 'Proteínas',            unit: 'g'    },
  { key: 'salt',           label: 'Sal',                  unit: 'g'    },
  { key: 'sodium',         label: 'Sódio',                unit: 'g'    },
];

// Seção auxiliar com título padronizado
const Section: React.FC<{ title: string; icon?: React.ReactNode; children: React.ReactNode }> = ({
  title, icon, children,
}) => (
  <div className="space-y-2">
    <h3 className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
      {icon}
      {title}
    </h3>
    {children}
  </div>
);

const ProductInfo: React.FC<ProductInfoProps> = ({ product, userAllergens = [] }) => {
  if (!product) return null;

  // ── Alérgenos ──────────────────────────────────────────────────
  // Lista exibida: vem dos tags do produto (para UI)
  const allergensList: string[] =
    product.allergens_tags?.map((a: string) =>
      a.replace(/^en:/, '').replace(/-/g, ' ')
    ) || [];

  // Detecção real usa o motor unificado do AllergenScanner
  const dangerAllergens = detectAllergens(userAllergens, product);
  const isProductSafe   = dangerAllergens.length === 0;

  // Separa tags "seguras" das perigosas para exibição na lista de alérgenos declarados
  const normalize = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  const isDangerTag = (tag: string) =>
    dangerAllergens.some(
      (d) =>
        normalize(tag).includes(normalize(d)) ||
        normalize(d).includes(normalize(tag))
    );

  const dangerTags = allergensList.filter(isDangerTag);
  const safeTags   = allergensList.filter((t) => !isDangerTag(t));

  // ── Classificações ─────────────────────────────────────────────
  const grade = product.nutriscore_grade || product.nutrition_grade_fr;
  const nova  = product.nova_group;

  return (
    <Card className="w-full mt-4 border-2 border-border overflow-hidden">

      {/* ── Banner de status ─────────────────────────────────────── */}
      <div
        className={`px-4 py-3 flex items-center gap-2.5 ${
          isProductSafe
            ? 'bg-green-50 border-b border-green-200 dark:bg-green-950/30 dark:border-green-900'
            : 'bg-red-50 border-b border-red-200 dark:bg-red-950/30 dark:border-red-900'
        }`}
      >
        {isProductSafe ? (
          <>
            <ShieldCheck className="h-5 w-5 text-green-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                Produto seguro para o seu perfil
              </p>
              <p className="text-xs text-green-700/70 dark:text-green-400/70">
                Nenhum dos seus alérgenos foi detectado
              </p>
            </div>
          </>
        ) : (
          <>
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                Contém alérgenos do seu perfil
              </p>
              <p className="text-xs text-red-700/80 dark:text-red-400/70 font-medium capitalize">
                {dangerAllergens.join(', ')}
              </p>
            </div>
          </>
        )}
      </div>

      {/* ── Cabeçalho do produto ─────────────────────────────────── */}
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="flex items-start gap-3">
          {product.image_front_url && (
            <img
              src={product.image_front_url}
              alt={product.product_name || 'Produto'}
              className="w-16 h-16 object-contain rounded-xl border bg-white shrink-0 shadow-sm"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold leading-tight">
              {product.product_name || 'Nome não disponível'}
            </p>
            {product.brands && (
              <p className="text-xs text-muted-foreground font-normal mt-0.5">{product.brands}</p>
            )}
            {product.quantity && (
              <p className="text-xs text-muted-foreground font-normal">{product.quantity}</p>
            )}

            {/* ── Badges de classificação ── */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {product.code && (
                <Badge variant="outline" className="text-xs font-mono">
                  EAN: {product.code}
                </Badge>
              )}
              {grade && (
                <Badge
                  className={`${NUTRI_BG[grade.toLowerCase()] || 'bg-muted'} text-white text-xs uppercase font-bold`}
                  title="Nutri-Score: pontuação nutricional do produto"
                >
                  Nutri-Score {grade.toUpperCase()}
                </Badge>
              )}
              {nova && (
                <Badge
                  className={`${NOVA_BG[nova] || 'bg-muted'} text-white text-xs font-bold`}
                  title={NOVA_LABELS[nova]}
                >
                  NOVA {nova}
                </Badge>
              )}
            </div>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <ScrollArea className="max-h-[65vh]">
          <div className="space-y-5 pr-2">

            {/* ── Classificações detalhadas ─────────────────────── */}
            {(grade || nova) && (
              <Section title="Classificações" icon={<Zap className="h-3.5 w-3.5 text-muted-foreground" />}>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {grade && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center text-white font-black text-base shrink-0 ${NUTRI_BG[grade.toLowerCase()] || 'bg-muted'}`}
                      >
                        {grade.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-semibold">Nutri-Score</p>
                        <p className="text-[11px] text-muted-foreground leading-tight">
                          Pontuação nutricional (A–E)
                        </p>
                      </div>
                    </div>
                  )}
                  {nova && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center text-white font-black text-base shrink-0 ${NOVA_BG[nova] || 'bg-muted'}`}
                      >
                        {nova}
                      </div>
                      <div>
                        <p className="text-xs font-semibold">Grupo NOVA {nova}</p>
                        <p className="text-[11px] text-muted-foreground leading-tight">
                          {NOVA_LABELS[nova]}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Section>
            )}

            <Separator />

            {/* ── Alérgenos declarados ──────────────────────────── */}
            <Section
              title="Alérgenos declarados"
              icon={<AlertTriangle className="h-3.5 w-3.5 text-orange-500" />}
            >
              {allergensList.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {dangerTags.map((a, i) => (
                    <Badge
                      key={`d-${i}`}
                      className="bg-red-600 hover:bg-red-600 text-white border-0 capitalize text-xs font-semibold gap-1"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      {a}
                    </Badge>
                  ))}
                  {safeTags.map((a, i) => (
                    <Badge key={`s-${i}`} variant="secondary" className="capitalize text-xs">
                      {a}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400 p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <p className="text-sm">Nenhum alérgeno declarado para este produto.</p>
                </div>
              )}
            </Section>

            <Separator />

            {/* ── Ingredientes ──────────────────────────────────── */}
            {product.ingredients_text && (
              <>
                <Section title="Ingredientes" icon={<Leaf className="h-3.5 w-3.5 text-muted-foreground" />}>
                  <p className="text-xs text-muted-foreground leading-relaxed bg-muted/40 p-3 rounded-xl border border-border">
                    {product.ingredients_text}
                  </p>
                </Section>
                <Separator />
              </>
            )}

            {/* ── Tabela nutricional ────────────────────────────── */}
            {product.nutriments && (
              <>
                <Section
                  title={`Informação Nutricional — por ${product.nutrition_data_per || '100g'}`}
                  icon={<FlaskConical className="h-3.5 w-3.5 text-muted-foreground" />}
                >
                  <div className="rounded-xl border border-border overflow-hidden">
                    {NUTRIENTS
                      .filter(({ key }) => product.nutriments[key] !== undefined && product.nutriments[key] !== null)
                      .map(({ key, label, unit }, idx, arr) => (
                        <div
                          key={key}
                          className={`flex justify-between items-center px-3 py-2 text-xs ${
                            idx % 2 === 0 ? 'bg-muted/30' : 'bg-background'
                          } ${idx < arr.length - 1 ? 'border-b border-border' : ''}`}
                        >
                          <span className="text-muted-foreground">{label}</span>
                          <span className="font-semibold tabular-nums">
                            {product.nutriments[key]}{unit}
                          </span>
                        </div>
                      ))}
                  </div>
                </Section>
                <Separator />
              </>
            )}

            {/* ── Fotos do rótulo ───────────────────────────────── */}
            {(product.image_ingredients_url || product.image_nutrition_url) && (
              <>
                <Section title="Fotos do rótulo">
                  <div className="flex flex-wrap gap-2">
                    {product.image_ingredients_url && (
                      <div className="flex-1 min-w-[130px]">
                        <p className="text-xs text-muted-foreground mb-1">Ingredientes</p>
                        <img
                          src={product.image_ingredients_url}
                          alt="Ingredientes"
                          className="w-full h-auto rounded-xl border shadow-sm"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    )}
                    {product.image_nutrition_url && (
                      <div className="flex-1 min-w-[130px]">
                        <p className="text-xs text-muted-foreground mb-1">Tabela nutricional</p>
                        <img
                          src={product.image_nutrition_url}
                          alt="Tabela Nutricional"
                          className="w-full h-auto rounded-xl border shadow-sm"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    )}
                  </div>
                </Section>
                <Separator />
              </>
            )}

            {/* ── Metadados ─────────────────────────────────────── */}
            <div className="space-y-1 text-xs text-muted-foreground">
              {product.categories && (
                <p><span className="font-medium text-foreground">Categorias:</span> {product.categories}</p>
              )}
              {product.countries && (
                <p><span className="font-medium text-foreground">Países:</span> {product.countries}</p>
              )}
              {product.labels && (
                <p><span className="font-medium text-foreground">Selos:</span> {product.labels}</p>
              )}
            </div>

            {/* ── Link Open Food Facts ──────────────────────────── */}
            {product.code && (
              <a
                href={`https://world.openfoodfacts.org/product/${product.code}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
              >
                Ver ficha completa no Open Food Facts
                <ExternalLink className="h-3 w-3" />
              </a>
            )}

            {/* ── Aviso de responsabilidade ─────────────────────── */}
            <p className="text-xs text-muted-foreground border-t border-border pt-3 leading-relaxed">
              Dados fornecidos pela base colaborativa Open Food Facts (openfoodfacts.org).
              Sempre confirme as informações na embalagem do produto antes do consumo.
            </p>

          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ProductInfo;
