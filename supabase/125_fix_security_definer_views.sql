-- ---------------------------------------------------------------------------
-- Corrige os 2 avisos CRÍTICOS de segurança do Supabase Advisor que eram
-- reais (os outros dois — public_catalog e public_blog_posts — são
-- intencionais: views públicas de propósito, com select já liberado pra
-- anon/authenticated de caso pensado; não mexi nelas).
--
-- O problema de fundo: uma view sem "security_invoker = true" roda com o
-- privilégio de quem CRIOU ela (normalmente a role que roda as migrations,
-- que tem acesso irrestrito), não de quem está consultando — ou seja, ela
-- ignora completamente as policies de RLS das tabelas por trás. Supabase
-- concede select em toda tabela/view nova do schema public pra anon e
-- authenticated por padrão (revogado abaixo por segurança, caso exista);
-- combinado com esse comportamento das views, isso deixava:
--
-- 1. customer_total_points consultável direto por QUALQUER cliente logado
--    (ou até anônimo) via API REST, expondo e-mail + pontuação de TODOS os
--    clientes — sem passar pelas funções (get_my_points etc.) que
--    deveriam ser o único acesso.
-- 2. product_stock consultável direto por qualquer CLIENTE logado (não só
--    equipe), expondo custo de importação (cost_price_brl) e estoque de
--    todos os produtos — informação interna, nunca deveria chegar no
--    cliente comum.
-- ---------------------------------------------------------------------------

-- 1. customer_total_points — só é usada de dentro de funções security
-- definer (get_my_points, get_leaderboard, ensure_club_benefit, etc.), que
-- continuam funcionando normalmente (elas já rodam com privilégio próprio,
-- independente do modo da view). Com security_invoker, uma consulta direta
-- de um cliente comum esbarra nas policies de sales/sale_items (só
-- is_staff()) e não traz nada.
revoke all on customer_total_points from anon, authenticated;
alter view customer_total_points set (security_invoker = true);

-- 2. product_stock — NÃO ligo security_invoker aqui: essa view é usada
-- por dentro de public_catalog (pública, pro site mostrar estoque
-- disponível pra qualquer visitante) — mudar o modo dela quebraria essa
-- cadeia (o join de public_catalog com inventory_movements passaria a
-- rodar como o visitante anônimo, que não tem acesso a inventory_movements
-- por RLS). Em vez disso, fecho o acesso direto à view (que nunca devia
-- ter existido pro cliente comum) e crio uma função própria, com a mesma
-- checagem is_staff() de todo o resto do painel, pro dashboard interno
-- usar no lugar da consulta direta.
revoke all on product_stock from anon, authenticated;

create or replace function get_product_stock()
returns table (
  product_id uuid,
  sku text,
  name text,
  category text,
  manufacturer text,
  min_stock_alert integer,
  cost_price_brl numeric,
  sale_price_brl numeric,
  length_cm numeric,
  height_cm numeric,
  width_cm numeric,
  quantity_in_stock bigint,
  piece_count integer,
  ncm text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    product_id, sku, name, category, manufacturer, min_stock_alert, cost_price_brl, sale_price_brl,
    length_cm, height_cm, width_cm, quantity_in_stock, piece_count, ncm
  from product_stock
  where is_staff();
$$;

grant execute on function get_product_stock() to authenticated;
