# Projeto: galerias de fotos ambientadas dos produtos Studio 18

**Status em 25/08/2026, pausado até 27/08 (conversão do trial Higgsfield).**

## Objetivo

Todos os produtos do catálogo (S18-001 a S18-017, carros e motos em LEGO
Technic-style de marcas genéricas como GULY/CADA/KBOX/REOBRIX) devem ter:

1. Uma **foto de capa correta** (`image_url`), mostrando o produto real tal
   como está nas fotos brutas do fabricante — nunca uma imagem genérica ou
   de outro kit.
2. Uma **galeria de 3-6 fotos extras** (`image_urls`), todas compostas no
   **mesmo cenário padronizado**: mesa de madeira escura, poltronas
   Chesterfield de couro desfocadas ao fundo, estante de livros iluminada,
   luz quente ambiente, profundidade de campo rasa (a mesma cena das fotos
   originais do site, ex. `site/public/products/S18-001.jpg`).

Cada produto tem uma pasta em `site/public/products-raw/S18-0XX-nome/` com
as fotos brutas enviadas pelo usuário (fundo branco/estúdio ou fotos
"reais" tiradas em casa) — essas são a fonte de verdade visual pra cada
ângulo.

## Progresso (25/08/2026)

| SKU | Produto | Capa | Galeria | SQL migration | Observação |
|---|---|---|---|---|---|
| S18-001 | Lamborghini LP5000 | ✅ já estava certa | ✅ 4 fotos (frente, lateral, traseira, caixa) | `031` — **rodar no Supabase** | — |
| S18-002 | Moto "BMW R1300GS" (GULY) | ✅ corrigida (tinha logo real da BMW, errado) | ⚠️ 3/4 fotos (falta **frente**, já gerada, falta usuário subir e eu aplicar) | `035` — **rodar no Supabase** | Nome do produto no catálogo ainda diz "BMW R1300GS" — sugerido renomear, usuário não respondeu ainda |
| S18-003 | Porsche 963 | ✅ já estava certa | ✅ 5 fotos (frente, lateral, traseira, aberto, caixa) | `032` — **rodar no Supabase** | — |
| S18-011 | Bugatti Tourbillon | ✅ já estava certa | ✅ 6 fotos (frente, acima, traseira, detalhe, aberto, caixa) | `033` — **rodar no Supabase** | Caixa teve que ser regerada 1x (saiu "GUEY" em vez de "GULY") |
| S18-016 | Land Rover Discovery | ✅ corrigida (carro errado) | ✅ 6 fotos (frente, lateral, traseira, detalhe, caixa) | `030` — já rodado pelo usuário | Primeiro produto feito; rodas tiveram que ser corrigidas (saíram pretas, deveriam ser prateadas) |
| S18-004 | BMW M4 GT4 | ✅ já estava certa (rodas douradas conferidas) | ✅ 6 fotos (frente, traseira, aberto, motor, interior, caixa) | `038` — **rodar no Supabase** | Primeiro produto a usar a técnica de "detalhe com fundo trocado" (ver seção abaixo) |
| S18-006 | Lotus Exige Cup 430 | ✅ já estava certa | ✅ 6 fotos (frente, lateral, traseira, aberto, motor, caixa) | `041` — **rodar no Supabase** | Marca real Lotus preservada (licenciada, aparece nas fotos brutas) |
| S18-007 | Mazda 787B | ✅ corrigida (faltava a marca "mazda", licenciada oficial) | ✅ 4 fotos (lateral, traseira, aberto, caixa) | `042` — **rodar no Supabase** | Marca real Mazda preservada. Foto extra de "motor aberto por trás" foi gerada mas reprovada pelo usuário — não faz parte da galeria final |
| S18-005 | Pagani Utopia | ✅ já estava certa | ⏸️ pausado — fotos brutas iniciais em 220x220 (baixa demais), usuário vai subir 2 fotos em resolução melhor (behind, box) depois | — | Retomar quando usuário voltar a esse produto |
| S18-008, 009, 010, 012, 013, 014, 015, 017 | (8 restantes) | — | — | — | Fotos brutas já em `products-raw/` — ainda não processados. S18-008 (Pagani Huayra) é o próximo da fila |

**Ação pendente imediata ao retomar**: confirmar se o usuário já rodou as
migrations `038`, `041` e `042` no SQL Editor do Supabase (031, 032, 033,
035 já confirmadas).

## Pipeline técnico (o que funciona)

1. **Ver as fotos brutas primeiro** (`Read` tool) e comparar com a capa
   atual do site antes de gerar qualquer coisa — muitas capas já estavam
   corretas (S18-001, S18-003, S18-011); só refazer quando houver
   divergência real (carro errado, roda errada, marca errada).
2. **Modelo Higgsfield**: `nano_banana_pro`, `resolution: "2k"`,
   `aspect_ratio: "4:3"`. Custo: **2 créditos por geração em 2k** (4 em
   4k). `remove_background`: **~1 crédito**.
3. **Para peças com muito detalhe fino** (motos, estruturas com tubos/raios
   finos): rodar `remove_background` na foto bruta primeiro pra isolar só
   o veículo (fundo transparente), e usar esse recorte limpo como
   referência — NUNCA pedir ao modelo pra "ignorar" o fundo/suporte de uma
   foto cheia (ele mistura/alucina detalhes). Prompt deve dizer
   explicitamente "pixel-level fidelity... do not redesign, simplify, or
   approximate any component". Isso resolveu um caso onde a moto
   (S18-002) saiu com detalhes errados usando a foto bruta inteira.
4. **Referência de cena**: usar a foto de capa **já aprovada** de QUALQUER
   produto (ex. a versão final corrigida do S18-016 ou a própria capa
   correta do produto atual) como "primeira imagem" no prompt, pedindo pra
   reproduzir a cena e ignorar o veículo nela. Preferir uma capa que não
   tenha o produto errado por perto, pra não arriscar contaminação visual.
5. **Nunca escrever "LEGO" nos prompts.** Todos os produtos são de marcas
   genéricas (GULY é a mais comum; também CADA, KBOX, REOBRIX). Sempre
   dizer "Technic-style building-block..." e instruir explicitamente:
   "this is not a LEGO product, no LEGO branding of any kind". Isso já
   causou erro real (caixa do S18-001 saiu com logo oficial da LEGO da
   primeira vez).
6. **Marcas reais que apareçam nos decalques da própria foto bruta são OK
   preservar** (ex. "PORSCHE 963" impresso na asa do S18-003) — a regra é
   nunca inventar marca que não está na referência, não nunca mostrar
   marca nenhuma.
7. **Texto pequeno (logos) erra fácil.** Quando a foto de referência da
   caixa for de baixa resolução, o texto da marca pode sair errado (ex.
   "GULY" virou "GUEY" pro S18-011, teve que gerar de novo). Mitigar
   passando uma SEGUNDA imagem de referência que mostre o nome da marca
   nítido em outra parte do produto (ex. grade/tanque) e escrever no
   prompt a grafia letra por letra: "spelling it G-U-L-Y, four letters".
8. **Fotos de marketing com overlay** (textos grandes tipo "PACKAGE SIZE",
   setas, comparações lado a lado, fundo de estúdio estilizado) precisam
   de instrução explícita pra "ignore the text banner/graphic background,
   extract only the vehicle/box itself".
9. **Foto de "caixa apenas"** (sem o carro montado do lado): pedir
   explicitamente pra não incluir o veículo montado no resultado, só a
   caixa em pé na mesa.
10. **Foto de detalhe/macro já bem enquadrada** (ex. motor) muitas vezes
    NÃO precisa ser recomposta na cena — já é boa fotografia de produto
    sozinha. Nesses casos, só copiar/converter a foto bruta direto pra
    `products/`, sem gastar créditos.
11. **Testar 1 imagem antes de gerar a galeria inteira**, especialmente
    depois de mudar de técnica (ex. antes de refazer as 4 fotos da moto
    com o método de recorte, testamos só a capa primeiro).
12. **Ângulos duplicados**: às vezes duas fotos brutas geram resultados
    quase idênticos (ex. duas laterais do S18-001). Perguntar ao usuário
    qual manter em vez de assumir — mas se a duplicidade for óbvia (mesma
    pose, só muda o fundo estúdio-vs-quarto), pode escolher a melhor e só
    avisar depois, sem travar o fluxo.
13. **Fotos de "detalhe" macro tiradas em ambiente real** (cabine/painel,
    motor bem de perto) que mostram um pedaço do quarto/parede ao redor
    (ex. guarda-roupa branco atrás da cabine) precisam de um tratamento
    DIFERENTE do composite normal: em vez de "recriar o veículo inteiro
    sentado na mesa", a instrução deve ser "troca de fundo, preservando o
    assunto". Funcionou muito bem (aprovado pelo usuário, S18-004) com
    este prompt: apresentar a foto-cena como primeira referência e a foto
    de detalhe como segunda, e pedir explicitamente "keep the entire
    subject from the second image completely unchanged, pixel-for-pixel
    identical — same crop, same framing, same zoom level — and ONLY
    replace the plain wall/closet background visible in the gaps with a
    softly out-of-focus warm bokeh continuation of the first image's
    scene... Do not zoom out, do not change the subject in any way —
    background only." Ou seja: NÃO tentar recompor o carro inteiro numa
    mesa quando a foto já é um close-up de detalhe — só substituir o que
    aparece de fundo pelos tons/desfoque do cenário padrão, mantendo o
    enquadramento e o assunto exatamente como na foto bruta.

## Limitação de rede (não contornável)

Este ambiente **bloqueia egress para os domínios de storage da Higgsfield**
(`*.cloudfront.net`) por política — `curl`, `WebFetch`, tudo falha com
`EGRESS_BLOCKED`. Portanto:

- Eu **envio o link** do resultado gerado pro usuário revisar (o link abre
  normal no navegador dele).
- Se aprovado, o usuário **baixa o PNG e sobe direto pelo GitHub** (na
  pasta `site/public/products/`, branch de produção) — não existe outro
  caminho.
- Depois que ele sobe, eu **puxo via `raw.githubusercontent.com`** (esse
  domínio NÃO é bloqueado), converto pra `.jpg` otimizado (Pillow, 2250x1680,
  quality=85) e faço o commit final.
- Uploads do usuário às vezes caem no lugar errado (raiz de `site/` em vez
  de `site/public/products/`, nomes com espaço/acento tipo "trás.png" em
  vez de "acima") — sempre conferir com `git show --stat` no commit mais
  recente antes de assumir onde o arquivo está.

## Estrutura de código

- **`site/src/components/ProductGallery.tsx`**: componente principal da
  galeria (usado em toda página de produto). Crossfade + leve zoom (Ken
  Burns) entre fotos, setas de navegação discretas (aparecem no hover),
  trilha de miniaturas com fade nas bordas (sem scrollbar nativa, com
  scroll-snap) que **rola automaticamente** até a miniatura ativa. Sem
  overlay de progresso sobre a imagem principal (removido a pedido do
  usuário — achou "não clean").
- **`site/src/components/ProductLightbox.tsx`**: modal fullscreen (usa
  `createPortal` pro `document.body` — necessário porque o `motion.div`
  ancestral do Product.tsx aplica `transform`, o que quebra
  `position: fixed` se não usar portal). Setas, teclado (Esc/←/→), swipe,
  indicador "n / total — label" abaixo da imagem (esse SIM continua,
  só o da imagem principal foi removido).
- **`site/src/lib/galleryLabels.ts`**: mapeia sufixo do arquivo pro label
  em português (frente→Frente, lateral→Lateral, traseira→Traseira,
  detalhe→Detalhe, aberto→Aberto, acima→Acima, caixa→Caixa). Extensível —
  adicionar aqui se aparecer um ângulo novo.
- **`site/src/lib/useSwipeNav.ts`**: hook de swipe compartilhado entre
  galeria embutida e lightbox.
- **Convenção de arquivo**: capa = `/products/S18-0XX.jpg`; galeria =
  `/products/S18-0XX-{label}.jpg` (mesmos labels do `galleryLabels.ts`).

## Onde os dados moram

- **Local/demo** (sem Supabase configurado): `site/src/lib/mockCatalog.ts`
  — array `image_urls` por produto, editado manualmente a cada galeria.
- **Produção**: tabela `products` no Supabase, coluna `image_urls`
  (`text[]`). Cada galeria nova = uma migration numerada em `supabase/`
  (`update products set image_urls = array[...] where sku = 'S18-0XX';`).
  **O usuário precisa rodar cada migration manualmente no SQL Editor do
  Supabase** — eu não tenho acesso direto ao banco de produção daqui.

## Git / deploy

- Branch de trabalho = **branch padrão do repo**:
  `claude/studio18-dashboard-inventory-64a10y` (a branch feature original
  `claude/studio18-land-rover-compositing-d0vl9z` foi deletada cedo na
  sessão sem PR; o usuário já vinha subindo fotos direto na branch
  padrão, então passei a commitar ali também, com autorização explícita
  dele).
- Deploy é via **Vercel**, que publica automaticamente a cada push na
  branch padrão (não tem GitHub Actions no repo).
- Sempre `git fetch` + `git rebase origin/<branch>` antes de push — o
  usuário sobe arquivos direto pelo GitHub o tempo todo em paralelo, então
  divergência é comum.

## Créditos Higgsfield

- Sessão rodou no trial de 3 dias (100 créditos, iniciado ~24/08).
- Consumo até agora: **~90 créditos** pra 5 produtos (incluindo
  retrabalhos de fidelidade/marca).
- Estimativa pros 12 produtos restantes: **~15-25 créditos cada**
  (5-6 fotos + folga pra correções) → **~200-300 créditos no total**.
- **Trial converte automaticamente pro plano Plus mensal ($49/mês, 1.000
  créditos) em 27/08/2026 ~14:04 UTC** (usuário optou por esperar essa
  conversão em vez de assinar manualmente agora). 1.000 créditos/mês
  cobre com folga o restante do catálogo.
- Checar saldo com `mcp__Higgsfield__balance` ao retomar.

## Próximos passos ao retomar

**Estado em 27/08/2026 (continuação)**: S18-004 (BMW M4 GT4) finalizado —
galeria de 6 fotos (frente, traseira, aberto, motor, interior, caixa)
convertida pra `.jpg`, wired em `mockCatalog.ts`, migration
`038_s18004_gallery_images.sql` criada (pendente rodar no Supabase).
Trial convertido pro plano Plus (1.000 créditos/mês). Migrations `031`,
`032`, `033`, `035` já rodadas pelo usuário no Supabase. S18-002
finalizado como está (sem foto "frente", decisão do usuário) e nome
"BMW R1300GS" mantido no catálogo (decisão do usuário, não mexer). Fotos
brutas de **todos os 17 produtos** já estão em `products-raw/`.

1. Lembrar o usuário de rodar a migration `038` no Supabase.
2. Confirmar créditos disponíveis (`balance`).
3. Seguir com os 11 produtos restantes (S18-005 a 010, 012 a 015, 017),
   um de cada vez, na ordem numérica ou pela preferência do usuário. Fotos
   brutas já estão todas disponíveis, então não é mais preciso perguntar
   se foram subidas — só ver as fotos de cada pasta antes de começar.
4. Seguir o mesmo pipeline validado: ver fotos brutas → comparar com capa
   atual → corrigir capa só se necessário → identificar se alguma foto é
   "detalhe em ambiente real" (técnica do item 13) vs ângulo normal do
   carro inteiro (técnica do item 3, recorte de fundo pra estruturas
   finas) → gerar galeria → testar 1 imagem se for técnica nova/incerta →
   mostrar link pro usuário → usuário baixa e sobe no GitHub → puxar,
   converter, wire no `mockCatalog.ts` + migration SQL → commit e push →
   lembrar o usuário de rodar a migration no Supabase.
