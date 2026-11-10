-- Studio 18 — Selos Digitais 2.0: pontos, clubes e ranking direto na conta
-- do site, sem depender mais do portal externo da BOB. Rode no SQL Editor
-- do Supabase.
--
-- DESIGN: pontos de COMPRA (1 peça = 1 ponto, +500 por motor funcional)
-- nunca são "creditados" manualmente em lugar nenhum — são sempre
-- calculados ao vivo a partir de `sales`/`sale_items`/`products`, que já
-- existem e já têm o histórico completo. Por isso não precisa de nenhuma
-- migration de backfill: no instante em que isso for pra produção, todo o
-- histórico de vendas pagas já aparece correto (pontos, selos, ranking,
-- clube), sem nenhum passo manual extra. A tabela `customer_points_ledger`
-- (já existente) continua existindo só pra pontos que NÃO vêm de compra —
-- hoje, o bônus de depoimento (+1000, já creditado automaticamente no envio
-- — ver submit-testimonial) — e pra ajustes manuais futuros, se precisar.

-- ---------------------------------------------------------------------------
-- 0. Corrige uma policy que ficou desatualizada: foi escrita DEPOIS de
-- is_staff() já existir (025), mas ainda usava auth.role() = 'authenticated'
-- — ou seja, hoje qualquer CLIENTE logado no site (não só a equipe)
-- consegue ler a tabela inteira de pontos de todo mundo via API. O cliente
-- vai acessar os próprios pontos só pelas funções abaixo (security
-- definer), então a tabela em si fica só pra equipe.
-- ---------------------------------------------------------------------------
drop policy if exists "authenticated can view points ledger" on customer_points_ledger;
create policy "staff can view points ledger" on customer_points_ledger
  for select using (is_staff());

-- ---------------------------------------------------------------------------
-- 1. Cupom pessoal de benefício de clube (mesmo padrão do referral_reward).
-- ---------------------------------------------------------------------------
alter table coupons drop constraint if exists coupons_kind_check;
alter table coupons add constraint coupons_kind_check
  check (kind in ('staff', 'referral_code', 'referral_reward', 'club_reward'));

-- ---------------------------------------------------------------------------
-- 2. Pontos totais por cliente (view auxiliar, usada pelas funções abaixo).
-- Soma peças (1 peça = 1 ponto) + bônus de motor funcional (+500, detectado
-- pela categoria 'motor' do produto — o motor de cada set já é cadastrado
-- como um produto próprio nessa categoria, ver 058_motor_option.sql) +
-- pontos avulsos do ledger (hoje só o bônus de depoimento).
-- ---------------------------------------------------------------------------
create or replace view customer_total_points as
with purchase_points as (
  select s.customer_contact as customer_email, sum(si.quantity * coalesce(p.piece_count, 0)) as pts
  from sale_items si
  join sales s on s.id = si.sale_id and s.status = 'pago'
  join products p on p.id = si.product_id
  where s.customer_contact is not null
  group by s.customer_contact
),
motor_points as (
  select s.customer_contact as customer_email, sum(si.quantity * 500) as pts
  from sale_items si
  join sales s on s.id = si.sale_id and s.status = 'pago'
  join products p on p.id = si.product_id
  where p.category = 'motor' and s.customer_contact is not null
  group by s.customer_contact
),
ledger_points as (
  select customer_email, sum(points) as pts
  from customer_points_ledger
  group by customer_email
)
select
  coalesce(pp.customer_email, mp.customer_email, lp.customer_email) as customer_email,
  (coalesce(pp.pts, 0) + coalesce(mp.pts, 0) + coalesce(lp.pts, 0))::bigint as total_points
from purchase_points pp
full outer join motor_points mp using (customer_email)
full outer join ledger_points lp using (customer_email);

-- ---------------------------------------------------------------------------
-- 3. Nome de exibição formatado ("Primeiro ÚltimaInicial.") — nunca expõe o
-- nome completo fora do banco, nem pro próprio ranking (o cliente só recebe
-- o nome já truncado, nunca o nome cru de outro colecionador).
-- ---------------------------------------------------------------------------
create or replace function format_display_name(full_name text)
returns text
language plpgsql
immutable
as $$
declare
  parts text[];
begin
  if full_name is null or trim(full_name) = '' then
    return 'Colecionador';
  end if;
  parts := regexp_split_to_array(trim(full_name), '\s+');
  if array_length(parts, 1) = 1 then
    return parts[1];
  end if;
  return parts[1] || ' ' || left(parts[array_length(parts, 1)], 1) || '.';
end;
$$;

-- Nome de origem: perfil salvo (customer_profiles.full_name) se existir,
-- senão o nome usado na compra mais recente daquele e-mail.
create or replace function get_display_name(p_email text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select format_display_name(
    coalesce(
      (
        select cp.full_name from customer_profiles cp
        join auth.users u on u.id = cp.user_id
        where u.email = p_email and cp.full_name is not null and trim(cp.full_name) <> ''
        limit 1
      ),
      (select s.customer_name from sales s where s.customer_contact = p_email order by s.created_at desc limit 1)
    )
  );
$$;

-- ---------------------------------------------------------------------------
-- 4. Estatísticas públicas da página de Selos Digitais (peças montadas,
-- selos emitidos, colecionadores) — sem nenhum dado pessoal, liberado pra
-- qualquer visitante (anon).
-- ---------------------------------------------------------------------------
create or replace function get_badges_public_stats()
returns table (total_pieces bigint, total_badges bigint, total_collectors bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce((
      select sum(si.quantity * coalesce(p.piece_count, 0))
      from sale_items si
      join sales s on s.id = si.sale_id and s.status = 'pago'
      join products p on p.id = si.product_id
    ), 0)::bigint as total_pieces,
    coalesce((
      select count(distinct (s.customer_contact, si.product_id))
      from sale_items si
      join sales s on s.id = si.sale_id and s.status = 'pago'
      join products p on p.id = si.product_id
      where p.category <> 'motor' and s.customer_contact is not null
    ), 0)::bigint as total_badges,
    coalesce((
      select count(distinct s.customer_contact)
      from sales s
      where s.status = 'pago' and s.customer_contact is not null
    ), 0)::bigint as total_collectors;
$$;

grant execute on function get_badges_public_stats() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Pontos + posição no ranking do cliente logado.
-- ---------------------------------------------------------------------------
create or replace function get_my_points()
returns table (total_points bigint, rank_position bigint, total_collectors bigint)
language sql
stable
security definer
set search_path = public
as $$
  with ranked as (
    select customer_email, total_points,
      rank() over (order by total_points desc) as rank_position
    from customer_total_points
  )
  select
    coalesce((select total_points from ranked where customer_email = auth.jwt() ->> 'email'), 0)::bigint,
    (select rank_position from ranked where customer_email = auth.jwt() ->> 'email'),
    (select count(*) from customer_total_points)::bigint;
$$;

grant execute on function get_my_points() to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Selos conquistados pelo cliente logado — 1 por SKU comprado (nunca por
-- unidade: comprar 2 do mesmo set não dobra o selo), com os pontos daquele
-- set (peças + bônus de motor, se aplicável).
-- ---------------------------------------------------------------------------
create or replace function get_my_badges()
returns table (sku text, name text, points bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.sku,
    p.name,
    sum(si.quantity * coalesce(p.piece_count, 0) + coalesce(motor_si.quantity, 0) * 500)::bigint as points
  from sale_items si
  join sales s on s.id = si.sale_id and s.status = 'pago'
  join products p on p.id = si.product_id and p.category <> 'motor'
  left join sale_items motor_si
    on motor_si.sale_id = si.sale_id and motor_si.product_id = p.motor_product_id
  where s.customer_contact = auth.jwt() ->> 'email'
  group by p.sku, p.name
  order by points desc;
$$;

grant execute on function get_my_badges() to authenticated;

-- ---------------------------------------------------------------------------
-- 7. Ranking (top N + a própria posição, se estiver fora do top N) — só
-- autenticado (decisão do usuário: ranking fica só pra quem está logado).
-- ---------------------------------------------------------------------------
create or replace function get_leaderboard(p_limit integer default 10)
returns table (rank_position bigint, display_name text, total_points bigint, is_you boolean)
language sql
stable
security definer
set search_path = public
as $$
  with ranked as (
    select customer_email, total_points,
      rank() over (order by total_points desc) as rank_position
    from customer_total_points
  ),
  top as (
    select r.rank_position, get_display_name(r.customer_email) as display_name, r.total_points,
      (r.customer_email = auth.jwt() ->> 'email') as is_you
    from ranked r
    order by r.rank_position
    limit p_limit
  ),
  me as (
    select r.rank_position, get_display_name(r.customer_email) as display_name, r.total_points, true as is_you
    from ranked r
    where r.customer_email = auth.jwt() ->> 'email' and r.rank_position > p_limit
  )
  select * from top
  union all
  select * from me
  order by rank_position;
$$;

grant execute on function get_leaderboard(integer) to authenticated;

-- ---------------------------------------------------------------------------
-- 8. Ativar o benefício do clube atual — o próprio banco calcula o clube
-- (nunca confia no cliente pra dizer qual desconto ele "merece"). Cria um
-- cupom pessoal de uso único (max_uses: 1), reaproveitando um já existente
-- e não usado em vez de duplicar. Só libera um novo depois de ter usado o
-- anterior, e só se o clube atual for de fato maior que o último usado
-- (evita reativar o mesmo nível de novo).
-- ---------------------------------------------------------------------------
create or replace function activate_club_benefit()
returns table (code text, discount_pct numeric, club_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_points bigint;
  v_pct numeric;
  v_club text;
  v_code text;
begin
  select total_points into v_points from customer_total_points where customer_email = auth.jwt() ->> 'email';
  v_points := coalesce(v_points, 0);

  v_club := case
    when v_points >= 100000 then 'Clube 100K'
    when v_points >= 75000 then 'Clube 75K'
    when v_points >= 50000 then 'Clube 50K'
    when v_points >= 25000 then 'Clube 25K'
    when v_points >= 10000 then 'Clube 10K'
    else null
  end;
  v_pct := case
    when v_points >= 100000 then 50
    when v_points >= 75000 then 35
    when v_points >= 50000 then 20
    when v_points >= 25000 then 10
    when v_points >= 10000 then 5
    else null
  end;

  if v_club is null then
    raise exception 'Pontuação insuficiente pra ativar um benefício de clube.';
  end if;

  if exists (
    select 1 from coupons c
    where c.owner_user_id = auth.uid() and c.kind = 'club_reward'
      and c.uses_count > 0 and c.discount_pct >= v_pct
  ) then
    raise exception 'Você já usou o benefício deste clube (ou de um nível igual ou maior).';
  end if;

  select c.code into v_code from coupons c
    where c.owner_user_id = auth.uid() and c.kind = 'club_reward' and c.uses_count = 0
    limit 1;

  if v_code is null then
    loop
      v_code := 'CLUBE-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
      begin
        insert into coupons (code, discount_pct, active, max_uses, kind, owner_user_id)
        values (v_code, v_pct, true, 1, 'club_reward', auth.uid());
        exit;
      exception when unique_violation then
        -- código colidiu com um já existente (raríssimo) — gera outro
      end;
    end loop;
  else
    -- já existia um pendente (ex: subiu de clube antes de usar o anterior)
    -- — atualiza pro desconto do clube atual em vez de deixar desatualizado.
    update coupons set discount_pct = v_pct where code = v_code;
  end if;

  return query select v_code, v_pct, v_club;
end;
$$;

grant execute on function activate_club_benefit() to authenticated;

-- Pro checkout saber, sem precisar que o cliente digite o código, se existe
-- um benefício de clube já ativado e ainda não usado (pra aplicar sozinho).
create or replace function get_my_active_club_coupon()
returns table (code text, discount_pct numeric)
language sql
stable
security definer
set search_path = public
as $$
  select c.code, c.discount_pct
  from coupons c
  where c.owner_user_id = auth.uid() and c.kind = 'club_reward' and c.uses_count = 0 and c.active
  order by c.created_at desc
  limit 1;
$$;

grant execute on function get_my_active_club_coupon() to authenticated;
