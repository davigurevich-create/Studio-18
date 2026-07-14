# Studio 18 — Site

Site institucional e vitrine imersiva da Studio 18: manifesto, diferenciais e a
galeria dos 17 modelos do primeiro container, com página de produto e checkout.

Tema escuro (carbono + dourado), com uma cena 3D ambiente no hero (React Three
Fiber) e animações de entrada em scroll (Framer Motion).

## Rodando localmente

```bash
npm install
npm run dev
```

### Modo demonstração

Sem `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` configuradas, o site usa os 17
produtos de exemplo embutidos (`src/lib/mockCatalog.ts`) e o checkout não salva
pedido nenhum — só simula a confirmação na tela.

## Conectando ao mesmo Supabase do painel de gestão

Este site é feito para **compartilhar o mesmo projeto Supabase** do painel de
gestão (`/` na raiz do repositório):

1. Rode `supabase/schema.sql` e `supabase/migrations/002_site_catalog_fields.sql`
   (raiz do repo) no seu projeto Supabase — eles criam a view `public_catalog`
   (que este site lê) e as policies que permitem o checkout público.
2. Rode `supabase/seed_17_products.sql` para cadastrar os 17 modelos confirmados.
3. Crie `.env` aqui (copie de `.env.example`) com a mesma URL/chave anônima do
   painel de gestão.

### Como funciona a integração

- **Catálogo**: a Home e a página de produto leem a view `public_catalog`, que
  já traz nome, fabricante, escala, peças, preço e estoque disponível. Qualquer
  produto que você cadastrar no painel (**Estoque → + Produto**) aparece aqui
  automaticamente (desde que esteja marcado como `active`).
- **Pedidos**: quando alguém finaliza um pedido no checkout, uma Supabase Edge
  Function cria a venda com `status = "pendente"` e `channel = "site"` nas
  tabelas `sales`/`sale_items` e gera a cobrança real no Mercado Pago — a
  mesma venda aparece na hora em **Vendas** no painel de gestão, e o status
  muda para `"pago"` automaticamente assim que o pagamento é confirmado (veja
  abaixo).
- **Fotos**: até você enviar as fotos reais dos 17 sets, os cards mostram um
  selo dourado "Foto em breve" com um ícone estilizado. Assim que tiver os
  arquivos, me envie que eu subo e conecto em `image_url`/`image_urls` de cada
  produto.

## Sobre o checkout (Mercado Pago)

O checkout processa pagamento de verdade via **Mercado Pago** (PIX, cartão e
boleto). A cobrança é criada por uma Supabase Edge Function — o Access Token
do Mercado Pago fica só lá, nunca no código do site.

### Como configurar

1. Crie uma aplicação em https://www.mercadopago.com.br/developers/panel e
   pegue as **credenciais de teste** (Public Key + Access Token) — depois,
   quando for para produção, repita com as credenciais de produção.
2. Rode `supabase/005_payment_gateway.sql` (raiz do repo) no SQL Editor do
   Supabase — adiciona as colunas de rastreamento do pagamento em `sales`.
3. Instale a Supabase CLI e faça login (`npx supabase login`), depois linke
   o projeto: `npx supabase link --project-ref SEU_PROJECT_REF`.
4. Configure o segredo do Access Token (nunca vai para o `.env` do site):
   ```bash
   npx supabase secrets set MP_ACCESS_TOKEN=SEU_ACCESS_TOKEN
   ```
5. Publique as duas functions:
   ```bash
   npx supabase functions deploy mp-create-payment
   npx supabase functions deploy mp-webhook
   ```
6. No painel do Mercado Pago (Suas integrações → sua aplicação → Webhooks),
   cadastre a URL `https://SEU-PROJETO.supabase.co/functions/v1/mp-webhook`
   e assine o evento `payment`.
7. No `.env` do site, adicione `VITE_MP_PUBLIC_KEY` (a Public Key — essa é
   segura para expor no navegador, só o Access Token é secreto).

Sem `VITE_MP_PUBLIC_KEY` configurada, o checkout continua funcionando em modo
demonstração (registra o pedido como pendente, mas não cobra ninguém).

## Deploy

Mesmo fluxo do painel de gestão: publique este diretório (`/site`) como um
projeto separado no Vercel, com as mesmas variáveis de ambiente
`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
