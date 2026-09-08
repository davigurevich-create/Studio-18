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
  tabelas `sales`/`sale_items` e gera a cobrança real na Rede — a mesma venda
  aparece na hora em **Vendas** no painel de gestão, e o status muda para
  `"pago"` automaticamente assim que o pagamento é confirmado (veja abaixo).
- **Fotos**: até você enviar as fotos reais dos 17 sets, os cards mostram um
  selo dourado "Foto em breve" com um ícone estilizado. Assim que tiver os
  arquivos, me envie que eu subo e conecto em `image_url`/`image_urls` de cada
  produto.

## Sobre o checkout (Rede)

O checkout processa pagamento de verdade via **Rede** (PIX e cartão de
crédito). A cobrança é criada por uma Supabase Edge Function — o PV e a chave
de integração da Rede ficam só lá, nunca no código do site. Diferente do
Mercado Pago, a Rede não tem um componente de captura de cartão no
navegador — os dados do cartão são enviados pelo formulário do checkout
direto pra Edge Function, que processa e nunca guarda esse dado.

### Como configurar

1. No painel da Rede (userede.com.br / developer.userede.com.br), gere o PV
   e a chave de integração — primeiro em ambiente de sandbox pra testar.
2. Rode `supabase/005_payment_gateway.sql` (raiz do repo) no SQL Editor do
   Supabase — adiciona as colunas de rastreamento do pagamento em `sales`.
3. Instale a Supabase CLI e faça login (`npx supabase login`), depois linke
   o projeto: `npx supabase link --project-ref SEU_PROJECT_REF`.
4. Configure os segredos (nunca vão para o `.env` do site):
   ```bash
   npx supabase secrets set REDE_PV=SEU_PV
   npx supabase secrets set REDE_CLIENT_SECRET=SUA_CHAVE_DE_INTEGRACAO
   npx supabase secrets set REDE_ENV=sandbox
   ```
5. Publique as duas functions:
   ```bash
   npx supabase functions deploy rede-create-payment
   npx supabase functions deploy rede-pix-webhook
   ```
6. Registre a URL de notificação do PIX junto à Rede:
   `https://SEU-PROJETO.supabase.co/functions/v1/rede-pix-webhook` — em
   sandbox dá pra registrar via API (`POST v1/transactions/notification-URL`);
   em produção é preciso ligar pro call center da Rede.
7. Quando migrar para produção, troque `REDE_ENV` para `production` e
   atualize `REDE_PV`/`REDE_CLIENT_SECRET` pelas credenciais reais.

Sem o Supabase configurado, o checkout continua funcionando em modo
demonstração (registra o pedido como pendente, mas não cobra ninguém).

## Deploy

Mesmo fluxo do painel de gestão: publique este diretório (`/site`) como um
projeto separado no Vercel, com as mesmas variáveis de ambiente
`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
