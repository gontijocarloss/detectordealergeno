# 🔍 Detector de Alérgenos Alimentares

> Trabalho de Conclusão de Curso — Ciência da Computação — IFMA Campus Imperatriz  
> Autor: Carlos Sérgio Silva Gontijo

---

## 📋 Sobre o Projeto

Sistema web para detecção de alérgenos em produtos alimentícios por meio da leitura de código de barras. O usuário configura seu perfil de alérgenos e, ao escanear um produto, recebe imediatamente um alerta caso o alimento contenha algum ingrediente de risco.

Os dados nutricionais e de composição são obtidos em tempo real pela API pública do **Open Food Facts**, base colaborativa com milhões de produtos cadastrados.

---

## ✨ Funcionalidades

- 📷 Leitura de código de barras via câmera do dispositivo
- ⚠️ Alerta visual imediato quando alérgenos do perfil são detectados
- 🛡️ Notificação de conformidade quando o produto é seguro
- 📊 Exibição de Nutri-Score e classificação NOVA do produto
- 🧪 Tabela nutricional completa (energia, gorduras, carboidratos, proteínas etc.)
- 🏷️ Lista de alérgenos declarados com destaque para os de risco
- 💊 Motor de detecção multidimensional (ingredientes + campos de alérgenos + traces)
- 📱 Interface responsiva para uso em dispositivos móveis
- 🌙 Suporte a tema claro/escuro

---

## 🧬 Motor de Detecção de Alérgenos

A detecção segue uma abordagem de **três camadas**, conforme descrito no capítulo 5.5 do TCC:

| Camada | Campo verificado | Descrição |
|--------|-----------------|-----------|
| 1 | `ingredients_text` | Texto livre da lista de ingredientes |
| 2 | `allergens` | Campo estruturado de alérgenos do produto |
| 3 | `allergens_tags` | Tags normalizadas de alérgenos |
| 4 | `traces_tags` | Tags de traços (contaminação cruzada) |

A comparação é feita com **normalização de acentos e capitalização**, evitando falsos negativos por diferenças de encoding.

---

## 🛠️ Tecnologias Utilizadas

| Tecnologia | Finalidade |
|------------|-----------|
| [React 18](https://react.dev/) | Interface do usuário |
| [TypeScript](https://www.typescriptlang.org/) | Tipagem estática |
| [Vite](https://vitejs.dev/) | Build e servidor de desenvolvimento |
| [Tailwind CSS](https://tailwindcss.com/) | Estilização |
| [shadcn/ui](https://ui.shadcn.com/) | Componentes de interface |
| [ZXing Library](https://github.com/zxing-js/library) | Leitura de código de barras |
| [react-webcam](https://github.com/mozmorris/react-webcam) | Acesso à câmera |
| [Open Food Facts API](https://world.openfoodfacts.org/data) | Base de dados de produtos |

---

## 🚀 Como Rodar Localmente

**Pré-requisitos:** Node.js 18+ instalado.

```bash
# 1. Clone o repositório
git clone https://github.com/SEU_USUARIO/detectordealergeno.git

# 2. Acesse a pasta
cd detectordealergeno

# 3. Instale as dependências
npm install

# 4. Rode o servidor de desenvolvimento
npm run dev
```

Acesse **http://localhost:8080** no navegador.

> ⚠️ A câmera só funciona em conexões seguras (HTTPS) ou em localhost.

---

## 📦 Build para Produção

```bash
npm run build
```

Os arquivos otimizados serão gerados na pasta `dist/`.

---

## 🌐 Acesso Online

A aplicação está hospedada em:  
🔗 **https://detectordealergeno.vercel.app** *(atualizar com o link real)*

---

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── AllergenScanner.tsx   # Scanner principal + motor de detecção
│   ├── ProductInfo.tsx       # Exibição dos dados do produto
│   ├── Hero.tsx              # Seção inicial da página
│   ├── AllergenFreeSearch.tsx
│   └── ui/                   # Componentes shadcn/ui
├── hooks/
│   └── use-toast.ts
├── lib/
│   ├── imageProcessing.ts    # Pré-processamento de imagem para leitura
│   └── utils.ts
└── pages/
    └── Index.tsx
```

---

## ⚖️ Legislação

Os alérgenos sugeridos seguem a **Resolução RDC nº 26/2015 da ANVISA**, que estabelece a lista obrigatória de substâncias alergênicas a serem declaradas nos rótulos de alimentos comercializados no Brasil.

---

## 📄 Licença

Este projeto foi desenvolvido para fins acadêmicos como Trabalho de Conclusão de Curso no Instituto Federal do Maranhão — IFMA Campus Imperatriz.

---

## 🙏 Agradecimentos

- [Open Food Facts](https://world.openfoodfacts.org/) pela base de dados aberta e gratuita
- IFMA Campus Imperatriz pela estrutura e orientação acadêmica
