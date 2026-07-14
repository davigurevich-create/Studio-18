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
- **Pedidos**: quando alguém finaliza um pedido no checkout, criamos uma venda
  com `status = "pendente"` e `channel = "site"` diretamente nas tabelas
  `sales`/`sale_items` — a mesma venda aparece na hora em **Vendas** no painel
  de gestão. Nenhum pagamento é processado de fato (veja abaixo).
- **Fotos**: até você enviar as fotos reais dos 17 sets, os cards mostram um
  selo dourado "Foto em breve" com um ícone estilizado. Assim que tiver os
  arquivos, me envie que eu subo e conecto em `image_url`/`image_urls` de cada
  produto.

## Sobre o checkout

O checkout tem PIX, Cartão e Boleto **só na interface** — não processa
pagamento de verdade ainda. Ele grava o pedido como "pendente" no banco (para
sua equipe acompanhar e contatar o cliente), mas não cobra ninguém. Para
processar pagamento de verdade, o próximo passo é integrar um gateway (ex:
Mercado Pago, que cobre PIX + boleto + cartão em uma única API e é o mais
usado no Brasil) — isso exige conta no gateway, chaves de API e uma função de
backend para confirmar o pagamento via webhook.

## Deploy

Mesmo fluxo do painel de gestão: publique este diretório (`/site`) como um
projeto separado no Vercel, com as mesmas variáveis de ambiente
`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
