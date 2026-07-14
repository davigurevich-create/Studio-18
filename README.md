# Studio 18

Este repositório tem dois projetos independentes que compartilham o mesmo
banco Supabase:

- **`/` (este diretório)** — Painel de Gestão: estoque, vendas e financeiro.
- **`/site`** — site institucional/vitrine 3D (manifesto, diferenciais, galeria
  dos 17 modelos, página de produto e checkout). Veja `site/README.md`.

## Painel de Gestão

Dashboard interno para controlar **estoque**, **vendas** e **financeiro** da Studio 18
(sets premium de blocos de montar 1:8 — carros, motos e motores).

## O que tem hoje

- **Visão geral**: faturamento do mês, margem, valor em estoque, alertas de estoque baixo.
- **Estoque**: cadastro de produtos/SKUs e registro de movimentações (entrada, saída, ajuste).
- **Vendas**: registro de vendas por canal (site, WhatsApp, Instagram, feira), com **baixa
  automática de estoque**.
- **Financeiro**: receita, custo da mercadoria vendida (CMV), despesas por categoria
  (importação, marketing, frete, operacional, taxas) e resultado líquido.
- **Containers**: acompanhamento das remessas vindas da China (status, previsão de
  chegada, custo de frete/alfândega).

## Rodando localmente

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`.

### Modo demonstração (sem configurar nada)

Sem nenhuma variável de ambiente configurada, o app roda em **modo demonstração**:
os dados ficam salvos só no `localStorage` do seu navegador, com alguns produtos e
vendas de exemplo já cadastrados. Serve para você testar o painel e mostrar para a
equipe antes de configurar o banco de dados real. Um aviso amarelo aparece no menu
lateral enquanto esse modo estiver ativo.

## Conectando ao banco de dados real (Supabase)

O painel usa [Supabase](https://supabase.com) (Postgres na nuvem, plano gratuito
cobre o início da operação). É o mesmo banco que o **Lovable** usa nativamente —
por isso dá para compartilhar os dados entre o painel de gestão e o site.

### 1. Criar o projeto Supabase

1. Crie uma conta em [supabase.com](https://supabase.com) e um novo projeto.
2. No **SQL Editor** do projeto, rode o conteúdo de `supabase/schema.sql` (cria as
   tabelas de produtos, containers, movimentações, vendas e despesas, com RLS
   habilitado).
3. Opcionalmente, rode `supabase/seed.sql` para popular com os mesmos dados de
   exemplo do modo demonstração.
4. Em **Authentication → Users**, crie um usuário (seu e-mail e uma senha) — é a
   conta que sua equipe vai usar para entrar no painel.

### 2. Configurar o painel para usar o Supabase

Em **Project Settings → API**, copie a **Project URL** e a **anon public key**.
Crie um arquivo `.env` na raiz do projeto (copie de `.env.example`):

```bash
cp .env.example .env
```

```
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_PUBLICA
```

Reinicie `npm run dev`. O aviso de "modo demonstração" some e o login passa a ser
exigido — entre com o usuário criado no passo anterior.

Ao publicar (Vercel, Netlify, etc.), configure essas duas variáveis nas
configurações de ambiente da plataforma escolhida.

## Integrando com o site do Lovable

Como o Lovable também usa Supabase, o caminho mais simples é os dois projetos
(painel de gestão e site) **apontarem para o mesmo projeto Supabase**:

1. No editor do Lovable, abra o painel de integração do Supabase (ícone do
   Supabase / aba "Integrations") e conecte o **mesmo projeto** que você criou
   acima — em vez de deixar o Lovable criar um projeto novo do zero.
2. Se o Lovable já tiver criado seu próprio projeto Supabase, você tem duas
   opções:
   - **Migrar**: rodar `supabase/schema.sql` nesse projeto que o Lovable já usa
     (assim o painel de gestão passa a apontar para ele também, via `.env`); ou
   - **Conectar o site ao projeto do painel**: trocar as credenciais Supabase
     do Lovable para apontar para o projeto criado acima.
3. No site (Lovable), para mostrar o catálogo com disponibilidade em estoque,
   consulte a view `public_catalog` (já criada pelo `schema.sql`), que expõe
   apenas nome, categoria, preço e quantidade disponível — sem custo de
   importação nem dados de vendas:

   ```ts
   const { data } = await supabase.from('public_catalog').select('*')
   ```

4. Quando o cliente compra pelo site, o Lovable pode inserir diretamente nas
   tabelas `sales` e `sale_items` (ou você mantém o site só como vitrine e
   registra os pedidos manualmente no painel, em **Vendas → Nova venda**) — os
   dois fluxos já derivam a baixa de estoque automaticamente via
   `inventory_movements`.

Assim, um pedido feito no site aparece no seu controle de vendas do painel, e o
estoque mostrado no site reflete o que você tem de fato disponível.

## Estrutura do banco

Rode nesta ordem no SQL Editor do Supabase:

1. `supabase/schema.sql` — tabelas base (produtos, containers, movimentações,
   vendas, despesas) + a view `public_catalog` que o site consome.
2. `supabase/migrations/002_site_catalog_fields.sql` — **só necessário se você
   já rodou o `schema.sql` antes desta atualização**: adiciona os campos que o
   site usa (fabricante, tag de coleção, história automotiva, dimensões,
   fotos) e as policies que permitem o checkout público criar vendas
   pendentes. Instalações novas já recebem tudo isso direto do `schema.sql`.
3. `supabase/seed_17_products.sql` — cadastra os 17 modelos do primeiro
   container.

| Tabela | Para quê |
|---|---|
| `products` | Catálogo de SKUs, custo/preço de venda, dados para o site (fabricante, história, dimensões) |
| `containers` | Remessas vindas da China (status, frete, alfândega) |
| `inventory_movements` | Entradas/saídas de estoque, ligadas a container ou venda |
| `sales` / `sale_items` | Vendas e itens vendidos (inclui pedidos criados pelo site) |
| `expenses` | Despesas (importação, marketing, operacional, frete, taxas) |
| `product_stock` (view) | Estoque atual calculado por produto |
| `public_catalog` (view) | Catálogo público, seguro para o site consumir |

## Próximos passos sugeridos

- Convidar os demais sócios/equipe como usuários no Supabase Auth.
- Enviar as fotos reais dos 17 modelos para substituir os placeholders no site.
- Atualizar `cost_price_brl` de cada produto quando souber o custo real de
  importação rateado por unidade (hoje está zerado).
- Ajustar `min_stock_alert` por produto conforme a demanda inicial.
- Quando quiser processar pagamento de verdade no site, integrar um gateway
  (ex: Mercado Pago) — ver `site/README.md`.
