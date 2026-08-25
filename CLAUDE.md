# Studio 18 — notas para retomar sessões

## Projeto em andamento: galerias de fotos ambientadas dos produtos

Há um projeto multi-sessão em andamento: recompor as fotos brutas de cada
produto (`site/public/products-raw/S18-0XX-*/`) no mesmo cenário
padronizado (mesa de madeira, poltronas de couro, estante ao fundo) e
montar a galeria de cada produto no site.

**Antes de fazer qualquer coisa relacionada a fotos de produto, imagens do
catálogo, Higgsfield, ou "galeria", leia primeiro:**
`docs/product-gallery-project.md` — tem o status completo (o que já foi
feito, o que falta, pra quais produtos o usuário já subiu fotos brutas),
todas as lições técnicas aprendidas (como evitar erros já cometidos:
menção a "LEGO", cor de roda errada, texto de marca ilegível, perda de
fidelidade em estruturas finas como motos) e o pipeline exato que
funciona.

## Fatos rápidos que valem pra qualquer sessão neste repo

- **Branch de trabalho = branch padrão do repo**:
  `claude/studio18-dashboard-inventory-64a10y`. O deploy (Vercel) publica
  automaticamente a cada push nela. Sempre `git fetch` + `rebase` antes de
  push — o usuário sobe arquivos direto pelo GitHub em paralelo o tempo
  todo.
- **Egress bloqueado para `*.cloudfront.net`** (armazenamento da
  Higgsfield) — não dá pra baixar resultados de geração de imagem
  diretamente. Fluxo: mandar o link pro usuário revisar → ele baixa e sobe
  pelo GitHub em `site/public/products/` → eu puxo via
  `raw.githubusercontent.com` (esse domínio funciona normalmente).
- **Nunca mencionar "LEGO" em prompts de geração de imagem** — os
  produtos são de marcas genéricas (GULY, CADA, KBOX, REOBRIX...), nunca
  LEGO. Sempre reforçar a marca exata da referência.
- Produção usa Supabase; toda mudança de `image_urls` de produto precisa
  de uma migration numerada em `supabase/` que **o usuário roda
  manualmente** no SQL Editor — eu não tenho acesso direto ao banco.
