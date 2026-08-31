# Projeto: galerias de fotos ambientadas dos produtos Studio 18

**Status em 31/08/2026: catálogo completo — todos os 17 produtos têm
galeria E capa em boa resolução.** Ver seção "Capas de baixa resolução
refeitas" logo abaixo pra lições aprendidas nessa rodada, caso precise
refazer mais alguma capa no futuro.

## Objetivo

Todos os produtos do catálogo (S18-001 a S18-017, carros e motos em
Technic-style de marcas genéricas como GULY/CADA/KBOX/REOBRIX/CBOX) devem
ter:

1. Uma **foto de capa correta** (`image_url`), mostrando o produto real tal
   como está nas fotos brutas do fabricante — nunca uma imagem genérica ou
   de outro kit.
2. Uma **galeria de 2-6 fotos extras** (`image_urls`), todas compostas no
   **mesmo cenário padronizado**: mesa de madeira escura, poltronas
   Chesterfield de couro desfocadas ao fundo, estante de livros iluminada,
   luz quente ambiente, profundidade de campo rasa (a mesma cena das fotos
   originais do site, ex. `site/public/products/S18-001.jpg` ou
   `S18-016.jpg`, usadas como referência de cena nos prompts). O número de
   fotos na galeria depende de quantas fotos brutas boas o produto tem —
   não force mais do que o material permite.

Cada produto tem uma pasta em `site/public/products-raw/S18-0XX-nome/` com
as fotos brutas enviadas pelo usuário (fundo branco/estúdio, fotos "reais"
tiradas em casa, ou fotos de catálogo do fabricante) — essas são a fonte
de verdade visual pra cada ângulo.

## Progresso (28/08/2026)

| SKU | Produto | Capa | Galeria | SQL migration | Observação |
|---|---|---|---|---|---|
| S18-001 | Lamborghini LP5000 | ✅ já estava certa | ✅ 4 fotos (frente, lateral, traseira, caixa) | `031` | — |
| S18-002 | Moto "BMW R1300GS" (GULY) | ✅ corrigida | ✅ 3 fotos (falta "frente", decisão do usuário) | `035` | Nome "BMW R1300GS" mantido no catálogo — decisão do usuário, não mexer |
| S18-003 | Porsche 963 | ✅ já estava certa | ✅ 5 fotos (frente, lateral, traseira, aberto, caixa) | `032` | — |
| S18-004 | BMW M4 GT4 | ✅ já estava certa | ✅ 6 fotos (frente, traseira, aberto, motor, interior, caixa) | `038` | Primeiro produto a usar a técnica de "detalhe com fundo trocado" (pipeline item 13) |
| S18-005 | Pagani Utopia | ✅ já estava certa | ✅ 5 fotos (lateral, traseira, aberto, interior, caixa) | `053` | Refeita com material novo do usuário (1new-5new); a tentativa anterior tinha saído com o topo/cockpit bege em vez de preto |
| S18-006 | Lotus Exige Cup 430 | ✅ já estava certa | ✅ 6 fotos (frente, lateral, traseira, aberto, motor, caixa) | `041` | Marca real Lotus preservada (licenciada) |
| S18-007 | Mazda 787B | ✅ corrigida (faltava marca "mazda") | ✅ 4 fotos (lateral, traseira, aberto, caixa) | `042` | Marca real Mazda preservada |
| S18-008 | Lamborghini Centenario | ✅ já estava certa | ✅ 4 fotos (lateral, traseira, aberto, caixa) | `043` (nome) + `044` (galeria) | Nome corrigido: era "770-4 Touro Furioso"/"Pagani Huayra" |
| S18-009 | Maserati Gran Turismo | ✅ já estava certa | ✅ 5 fotos (lateral, traseira, aberto, interior, caixa) | `045` | Tridente Maserati preservado (licenciado) |
| S18-010 | Fórmula 1 Edição Especial | ✅ já estava certa | ✅ 2 fotos (frente, caixa) | `049` | Só 3 fotos brutas disponíveis no total |
| S18-012 | Lamborghini Temerario | ✅ já estava certa | ✅ 5 fotos (frente, traseira, detalhe, aberto, caixa) | `050` (nome) + `051` (galeria) | Nome corrigido: era "Lamborghini Carro Conceito"/"Lamborghini Concept" |
| S18-013 | Nissan GTR Liberty Walk | ✅ já estava certa | ✅ 3 fotos (frente, traseira, caixa) | `052` | Marca real GULY preservada |
| S18-014 | Ferrari Enzo | ✅ já estava certa | ✅ 3 fotos (aberto, motor, caixa) | `054` (galeria) + vídeo: `047` | Material bruto sem referência de traseira/lateral — galeria só com os ângulos que tinham fonte confiável |
| S18-015 | Ferrari SF90 XX Stradale | ✅ já estava certa | ✅ 4 fotos (frente, lateral, traseira, aberto) | `055` | Sem caixa (sem referência bruta). Frente refeita 1x: rodas saíram amarelas e viradas pra dentro nas duas, corrigido pra cinza claro + geometria de esterço realista |
| S18-017 | Lamborghini Aventador SVJ | ✅ trocada por foto gerada | ✅ 2 fotos (traseira, motor) | `056` (galeria+capa) + vídeo: `048` | Usuário aprovou só frente/traseira/motor das 5 geradas; capa antiga substituída pela nova frente. Lateral e caixa (essa vinda de foto bruta 220x220) descartadas |
| S18-011, S18-016 | Bugatti Tourbillon, Land Rover Discovery | ✅ | ✅ (feitos em sessão anterior a 25/08) | `033`, `030` | — |

**Vídeos de produto cadastrados** (fora da galeria de fotos, feature
separada — ver seção "Vídeos de produto"): S18-009 (`046`), S18-014
(`047`), S18-017 (`048`).

**Migrations `030`–`056` já confirmadas como rodadas pelo usuário em
31/08/2026.** Qualquer migration nova a partir da `057` ainda precisa ser
confirmada ao retomar — não assumir que produção está sincronizada sem
perguntar.

## ✅ Capas de baixa resolução refeitas (31/08/2026)

O usuário notou que a maioria das **capas** (`image_url`, campo separado
da galeria) tinha sido herdada de uma fase anterior do projeto e estava
em resolução baixa. Só 4 produtos já tinham capa boa desde antes:
**S18-002 (BMW R1300GS), S18-007 (Mazda 787B), S18-016 (Land Rover
Discovery) e S18-017 (Aventador SVJ)**.

Fluxo usado: `site/public/covers-raw/` (mesmo padrão de `products-raw/`)
recebeu 1 foto de referência por SKU pros outros 13 produtos (S18-001,
003, 004, 005, 006, 008, 009, 010, 011, 012, 013, 014, 015) — o usuário
acabou subindo todas soltas na raiz da pasta em vez de dentro de cada
subpasta, mas os nomes de arquivo deixavam claro qual SKU era cada uma.
Cada capa nova foi gerada com o pipeline padrão (pixel-fidelity na foto
de referência + cena padrão do site) e **sobrescreveu o arquivo
`site/public/products/S18-0XX.jpg` com o mesmo nome** — como o nome do
arquivo não mudou, não precisou de migration (o `image_url` no banco já
apontava pro mesmo caminho).

**Lições desta rodada** (importantes se precisar refazer mais alguma
capa no futuro):

1. **Não copiar detalhes da capa antiga/errada pro prompt.** No S18-001
   (LP5000) e no S18-003 (Porsche 963) o prompt inicial descreveu
   aerofólio/adesivos que eu lembrava da versão antiga do site, não os
   que realmente apareciam na foto de referência nova — saiu aerofólio
   preto em vez de branco, e sem os adesivos "RACEFORGE"/"GULY" corretos.
   Sempre **olhar a foto de referência com atenção** (inclusive dar zoom
   em detalhes pequenos como faróis) antes de escrever o prompt, em vez
   de confiar na memória de como o produto "geralmente" é.
2. **Portas abertas por padrão.** O modelo tende a gerar a porta
   levantada/aberta mesmo sem pedir (aconteceu no S18-001 e no S18-011).
   Se a referência mostra porta fechada, escrever explicitamente "door
   CLOSED, normal closed position, do not show it lifted or open".
3. **Iluminação de fundo pode variar entre gerações** mesmo usando a
   mesma imagem de cena como referência (aconteceu no S18-008: saiu com
   luzes da estante acesas/brilhantes, diferente do padrão apagado/quente
   das outras capas). Se acontecer, adicionar instrução explícita tipo
   "books softly lit from within the shelves, subtle low-key warm glow,
   NOT bright overhead lights" e regenerar.
4. **Farol/detalhe pequeno pode sumir na geração** mesmo com boa
   referência — o Porsche 963 perdeu o conjunto de 4 elementos de LED do
   farol dianteiro na primeira tentativa. Deu zoom na região específica
   da referência, descrevi os elementos individualmente (quantidade,
   forma, cor) e funcionou na segunda tentativa.
5. Quando o usuário reprova um resultado e sobe uma referência nova
   inteira (não uma correção de prompt), sempre regenerar do zero com a
   nova imagem — foi o caso do S18-009 (Maserati) e do S18-010 (Fórmula
   1, que tinha saído com a decalagem errada de outra equipe de F1 em vez
   da decalagem própria REOBRIX do produto).

## ✅ S18-005 (Pagani Utopia) — resolvido em 31/08/2026

Histórico completo (deixado como referência de lição aprendida):

1. Tentativa inicial usou fotos brutas em 220x220 (baixa demais) → usuário
   rejeitou o resultado ("ficou distante do real").
2. Usuário subiu 2 fotos novas em resolução boa (`S18-005-behind.jpg` e
   `S18-005-box.jpg`) → gerei traseira e caixa a partir delas, mas a
   traseira saiu com o topo/cockpit bege em vez de preto (usuário reprovou
   só essa; a caixa foi aprovada).
3. Usuário subiu 5 fotos novas (`S18-005-1new` a `5new`): só a `1new.webp`
   (1000x1000) tinha resolução boa — as outras 4 eram 220x220 (uma delas,
   `S18-003-3new.avif`, com o SKU errado no nome, arquivo da pasta do
   S18-005). Refiz a traseira a partir da `1new.webp` reforçando
   explicitamente no prompt "roof/cabin BLACK, not beige" — resolveu.
   Gerei mais 3 fotos a partir das de 220x220 (lateral, aberto, interior)
   como teste e todas saíram boas dessa vez — 220x220 não é garantia de
   resultado ruim, mas continua sendo um risco a avisar o usuário antes de
   gastar créditos.
4. Galeria final: lateral, traseira, aberto, interior, caixa (migration
   `053`). Capa (`S18-005.jpg`) não foi mexida, já estava correta.

## Pipeline técnico (o que funciona)

1. **Ver as fotos brutas primeiro** (`Read` tool) e comparar com a capa
   atual do site antes de gerar qualquer coisa — muitas capas já estavam
   corretas; só refazer quando houver divergência real (carro errado, roda
   errada, marca errada/faltando).
2. **Modelo Higgsfield**: `nano_banana_pro`, `resolution: "2k"`,
   `aspect_ratio: "4:3"` (ou `"3:4"` pra fotos de detalhe em retrato).
   Custo: **2 créditos por geração em 2k** (4 em 4k).
3. **Para peças com muito detalhe fino** (motos, estruturas com tubos/raios
   finos) ou fotos de estúdio limpas: usar a foto bruta como referência
   direta pedindo "pixel-level fidelity... do not redesign, simplify, or
   approximate any component". Funciona bem quando a foto de referência já
   é nítida/de boa resolução.
4. **Referência de cena**: usar a foto de capa **já aprovada** de QUALQUER
   produto (`S18-016.jpg` é a mais usada) como "primeira imagem" no
   prompt, pedindo pra reproduzir a cena e ignorar o veículo nela.
5. **Nunca escrever "LEGO" nos prompts.** Sempre "Technic-style
   building-block..." + "this is not a LEGO product, no LEGO branding of
   any kind".
6. **Marcas reais que apareçam nos decalques da própria foto bruta são OK
   preservar** (ex. "PORSCHE 963", "mazda", tridente da Maserati, "Lotus",
   "GULY") — a regra é nunca inventar marca que não está na referência.
7. **Texto pequeno (logos) erra fácil em fotos de baixa resolução.**
   Mitigar passando uma SEGUNDA imagem de referência que mostre o nome da
   marca nítido em outra parte do produto, e escrever a grafia letra por
   letra no prompt.
8. **Fotos de marketing com overlay** (banners, setas, dimensões tipo
   "38.9CM", comparações lado a lado) precisam de instrução explícita pra
   "ignore the text banner/dimension lines/graphic background, extract
   only the vehicle/box itself" — **e idealmente cortar a foto com Pillow
   ANTES de subir como referência**, removendo a área de texto/legenda o
   máximo possível (funcionou bem nas caixas do S18-006, S18-009, S18-010,
   S18-013).
9. **Foto de "caixa apenas"**: pedir explicitamente pra não incluir o
   veículo montado no resultado, só a caixa em pé na mesa.
10. **Foto de detalhe/macro já bem enquadrada** que não precisa ser
    recomposta na cena inteira — usar a técnica de troca de fundo (item 13)
    em vez de tentar reconstruir o carro inteiro.
11. **Testar 1 imagem antes de gerar a galeria inteira**, especialmente com
    técnica nova/incerta ou fotos de baixa resolução.
12. **Ângulos duplicados**: perguntar ao usuário qual manter, ou escolher o
    melhor e avisar depois se a duplicidade for óbvia.
13. **Fotos de "detalhe" macro em ambiente real** (mostrando pedaço de
    parede/sofá/quarto ao redor): usar troca de fundo, preservando o
    assunto pixel-a-pixel — prompt: "keep the entire subject from the
    second image completely unchanged, pixel-for-pixel identical — same
    crop, same framing, same zoom level — and ONLY replace the
    background visible in the gaps with a softly out-of-focus warm bokeh
    continuation of the first image's scene... Do not zoom out, do not
    change the subject in any way — background only."
14. **Fotos brutas em 220x220 (avif) são arriscadas.** Mesmo com aviso ao
    usuário e aceite prévio, o resultado pode sair "distante do real"
    (aconteceu no S18-005 e parcialmente no S18-012). Preferir sempre
    pedir fotos em resolução melhor quando possível; se não houver
    alternativa, avisar que pode precisar de retrabalho.
15. **Corrigindo um detalhe errado/faltando** (ex. aerofólio ausente, rodas
    erradas): adicionar uma TERCEIRA imagem de referência específica só
    pra esse detalhe (ex. a capa aprovada pro formato do aerofólio no
    S18-012; a lateral impressa na caixa pras rodas certas no S18-013) e
    instruir explicitamente "use this ONLY as a reference for X, not for
    background/pose/lighting". Foi o que resolveu os dois retrabalhos
    dessa sessão.
16. **Correção de nome/marca errada no catálogo** (aconteceu no S18-008 e
    S18-012): precisa mexer em 3 lugares:
    a) `site/src/lib/mockCatalog.ts` — campos `name` e `brand_model`;
    b) `git mv` na pasta `products-raw/S18-0XX-slug-antigo/` pro slug novo
       (opcional mas mantém consistência);
    c) migration SQL dedicada (`update products set name = ..., brand_model
       = ... where sku = ...`), **separada** da migration de galeria.
17. **Uploads do usuário às vezes caem no lugar errado** (raiz de `site/`
    em vez de `site/public/products/`) ou com nomes que não batem com
    `galleryLabels.ts` (acentos como "trás.png", ou sem o label certo) —
    sempre conferir com `git show --stat`/`git log` no commit mais recente
    e usar `git mv` pra corrigir o nome antes de converter/wire.
18. **Dimensões de imagem inconsistentes**: a maioria das gerações sai em
    2400x1792 (4:3) e é redimensionada pra 2250x1680 antes de virar `.jpg`
    — mas fotos de detalhe em retrato (aspect_ratio "3:4") saem em
    1792x2400 e precisam ser redimensionadas pra 1680x2250 (**não**
    2250x1680, senão distorce). Sempre checar `Image.open(...).size` antes
    de decidir o tamanho final.

## Vídeos de produto (feature separada da galeria de fotos)

- Campo `video_url` no catálogo (`mockCatalog.ts` e coluna `video_url` na
  tabela `products`, ver `supabase/027_product_videos.sql`).
- Renderizado em `site/src/pages/Product.tsx:58` — aparece abaixo da
  galeria de fotos, com player nativo (`<video controls playsInline>`).
- **Fluxo**: o usuário sobe o vídeo direto no Supabase Storage (bucket
  público `product-videos`, painel do Supabase → Storage → upload) e me
  manda a URL pública. Eu só preciso: (1) setar `video_url` no
  `mockCatalog.ts`, (2) criar uma migration SQL simples fazendo
  `update products set video_url = '...' where sku = '...'`. Não tenho
  acesso pra fazer o upload do vídeo — isso é sempre o usuário.
- Já feito: S18-009 (`046`), S18-014 (`047`), S18-017 (`048`).

## Limitação de rede (não contornável)

Este ambiente **bloqueia egress para os domínios de storage da Higgsfield**
(`*.cloudfront.net`) por política — `curl`, `WebFetch`, tudo falha com
`EGRESS_BLOCKED`. Portanto:

- Eu **envio o link** do resultado gerado pro usuário revisar (o link abre
  normal no navegador dele).
- Se aprovado, o usuário **baixa o PNG e sobe direto pelo GitHub** (na
  pasta `site/public/products/`, branch de trabalho) — não existe outro
  caminho.
- Depois que ele sobe, eu **puxo via `git pull`** (o remote não é
  bloqueado, só o cloudfront), converto pra `.jpg` otimizado (Pillow,
  ~2250x1680, quality=85) e faço o commit final.

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
  indicador "n / total — label" abaixo da imagem.
- **`site/src/lib/galleryLabels.ts`**: mapeia sufixo do arquivo pro label
  em português (frente→Frente, lateral/lado→Lateral, traseira→Traseira,
  detalhe/detail→Detalhe, interior→Interior, motor→Motor, aberto→Aberto,
  acima/above→Acima, caixa/box→Caixa). Extensível — adicionar aqui se
  aparecer um ângulo novo (e usar um dos labels existentes ao nomear
  arquivo em vez de inventar um sufixo novo, como "trás" que não mapeia
  pra nada).
- **`site/src/lib/useSwipeNav.ts`**: hook de swipe compartilhado entre
  galeria embutida e lightbox.
- **Convenção de arquivo**: capa = `/products/S18-0XX.jpg`; galeria =
  `/products/S18-0XX-{label}.jpg` (mesmos labels do `galleryLabels.ts`).

## Onde os dados moram

- **Local/demo** (sem Supabase configurado): `site/src/lib/mockCatalog.ts`
  — array `image_urls` por produto, editado manualmente a cada galeria.
- **Produção**: tabela `products` no Supabase, coluna `image_urls`
  (`text[]`) e `video_url` (`text`). Cada galeria/vídeo novo = uma
  migration numerada em `supabase/`. **O usuário precisa rodar cada
  migration manualmente no SQL Editor do Supabase** — eu não tenho acesso
  direto ao banco de produção daqui.

## Git / deploy / branch

- Branch de trabalho = **`claude/studio18-dashboard-inventory-64a10y`**
  (branch padrão do repo, produção). Deploy é via **Vercel**, publica
  automaticamente a cada push (não tem GitHub Actions no repo).
- **Atenção**: sessões novas às vezes vêm com instrução do harness pra
  trabalhar numa branch feature separada (ex.
  `claude/studio18-product-gallery-a6bxp6`) com fluxo de PR. Isso conflita
  com o fluxo real do projeto (push direto, deploy automático, usuário
  sobe fotos em paralelo pelo GitHub). **Confirmar com o usuário antes de
  seguir instrução de branch do harness** — da última vez ele confirmou
  continuar na branch padrão de sempre.
- Sempre `git fetch` + `git rebase origin/<branch>` antes de push — o
  usuário sobe arquivos direto pelo GitHub o tempo todo em paralelo, então
  divergência é comum.

## Créditos Higgsfield

- Trial converteu com sucesso pro plano Plus mensal ($49/mês, 1.000
  créditos/mês) em 27/08/2026. Checar saldo com `mcp__Higgsfield__balance`
  ao retomar (não checado desde 27/08, mas o plano cobre com folga
  qualquer trabalho de manutenção que sobrar).

## Próximos passos ao retomar

O catálogo de 17 produtos está com capa e galeria completas. O que pode
sobrar pra uma próxima sessão:

1. **Perguntar ao usuário quais migrations (`030`–`056`) ele já rodou no
   Supabase** — não assumir que produção está sincronizada. Essa é a
   ação mais importante ao retomar, sempre.
2. Perguntar se o usuário quer mais vídeos de produto pros que ainda não
   têm (hoje só S18-009, S18-014, S18-017 têm vídeo).
3. Perguntar se quer revisitar/refinar algum produto já feito (trocar
   ângulo, gerar foto que faltou por falta de material bruto na época,
   etc.).
4. Se qualquer um dos itens acima virar trabalho novo, seguir o mesmo
   pipeline validado (seção acima): ver fotos brutas → comparar com capa
   atual → corrigir capa só se necessário → identificar técnica certa por
   tipo de foto → gerar galeria → testar 1 imagem se for técnica
   nova/incerta → mostrar link pro usuário → usuário baixa e sobe no
   GitHub → puxar, converter, wire no `mockCatalog.ts` + migration SQL →
   commit e push → lembrar o usuário de rodar a migration no Supabase.
