-- Studio 18 — Fase 1 da comunidade de colecionadores: fotos dos sets
-- montados (com aprovação da equipe antes de ficar público, mesmo padrão
-- já usado nos depoimentos), curtidas, e perfil público opcional de cada
-- colecionador (selos + fotos), linkável a partir do ranking. Comentários
-- ficam pra uma fase futura — combinado com o usuário. Rode no SQL Editor
-- do Supabase, depois de já ter rodado 111/112/113.

-- ---------------------------------------------------------------------------
-- 1. Perfil público — opt-in. Sem isso marcado, ninguém além da própria
-- pessoa (e da equipe) vê a coleção dela, mesmo que apareça no ranking.
-- ---------------------------------------------------------------------------
alter table customer_profiles add column if not exists public_profile boolean not null default false;

-- get_my_badges() ganha product_id — precisa dele pra mandar foto de um
-- set específico (submit_set_photo recebe o product_id, não o sku).
drop function if exists get_my_badges();

create function get_my_badges()
returns table (sku text, name text, points bigint, product_id uuid)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.sku,
    p.name,
    sum(si.quantity * coalesce(p.piece_count, 0) + coalesce(motor_si.quantity, 0) * 500)::bigint as points,
    p.id as product_id
  from sale_items si
  join sales s on s.id = si.sale_id and s.status in ('pago', 'enviado', 'entregue')
  join products p on p.id = si.product_id and p.category <> 'motor'
  left join sale_items motor_si
    on motor_si.sale_id = si.sale_id and motor_si.product_id = p.motor_product_id
  where s.customer_contact = auth.jwt() ->> 'email'
  group by p.sku, p.name, p.id
  order by points desc;
$$;

grant execute on function get_my_badges() to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Fotos dos sets montados.
-- ---------------------------------------------------------------------------
create table if not exists set_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references products(id),
  photo_url text not null,
  status text not null default 'pendente' check (status in ('pendente', 'aprovado', 'rejeitado')),
  created_at timestamptz not null default now()
);

alter table set_photos enable row level security;

create policy "customers manage own set photos" on set_photos
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Qualquer pessoa logada pode ver fotos aprovadas de qualquer colecionador
-- (precisa pra perfil público e pro "ver sets" do ranking) — pendente/
-- rejeitada só o dono (já coberto acima) e a equipe.
create policy "authenticated can view approved set photos" on set_photos
  for select using (status = 'aprovado' or is_staff());

create policy "staff can moderate set photos" on set_photos
  for update using (is_staff()) with check (is_staff());

-- Só pode mandar foto de um set que REALMENTE comprou (pago/enviado/
-- entregue) — nunca confia no product_id vindo direto do cliente sem
-- checar, mesma cautela de sempre. security definer pra poder validar
-- contra `sales`/`sale_items` sem abrir policy de leitura ampla nelas.
create or replace function submit_set_photo(p_product_id uuid, p_photo_url text)
returns set_photos
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := auth.jwt() ->> 'email';
  v_row set_photos;
begin
  if not exists (
    select 1 from sale_items si
    join sales s on s.id = si.sale_id and s.status in ('pago', 'enviado', 'entregue')
    where s.customer_contact = v_email and si.product_id = p_product_id
  ) then
    raise exception 'Você só pode enviar fotos de sets que já comprou.';
  end if;

  insert into set_photos (user_id, product_id, photo_url)
  values (auth.uid(), p_product_id, p_photo_url)
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function submit_set_photo(uuid, text) to authenticated;

-- Minhas próprias fotos (qualquer status) — pra mostrar "aguardando
-- aprovação" / "rejeitada" embaixo do selo, na própria conta.
create or replace function get_my_set_photos()
returns table (id uuid, product_id uuid, photo_url text, status text, created_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select id, product_id, photo_url, status, created_at
  from set_photos
  where user_id = auth.uid()
  order by created_at desc;
$$;

grant execute on function get_my_set_photos() to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Curtidas.
-- ---------------------------------------------------------------------------
create table if not exists set_photo_likes (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references set_photos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (photo_id, user_id)
);

alter table set_photo_likes enable row level security;

create policy "authenticated can view likes" on set_photo_likes
  for select using (auth.role() = 'authenticated');

create policy "customers manage own likes" on set_photo_likes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Curtir/descurtir num só RPC (alterna) — mais simples pro front do que
-- gerenciar insert/delete direto na tabela e reconciliar estado.
create or replace function toggle_set_photo_like(p_photo_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_liked boolean;
begin
  if exists (select 1 from set_photo_likes where photo_id = p_photo_id and user_id = auth.uid()) then
    delete from set_photo_likes where photo_id = p_photo_id and user_id = auth.uid();
    v_liked := false;
  else
    insert into set_photo_likes (photo_id, user_id) values (p_photo_id, auth.uid());
    v_liked := true;
  end if;
  return v_liked;
end;
$$;

grant execute on function toggle_set_photo_like(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Perfil público de um colecionador — selos + fotos aprovadas + curtidas.
-- Só retorna algo se o dono tiver marcado public_profile = true; senão
-- devolve tudo vazio/nulo (o front mostra "perfil privado").
-- ---------------------------------------------------------------------------
create or replace function get_public_profile(p_user_id uuid)
returns table (
  display_name text,
  total_points bigint,
  is_public boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_email text;
  v_public boolean;
begin
  select email into v_email from auth.users where id = p_user_id;
  select coalesce(cp.public_profile, false) into v_public from customer_profiles cp where cp.user_id = p_user_id;

  if v_email is null or not coalesce(v_public, false) then
    return query select null::text, 0::bigint, false;
    return;
  end if;

  return query
    select
      get_display_name(v_email),
      coalesce((select total_points from customer_total_points where customer_email = v_email), 0)::bigint,
      true;
end;
$$;

grant execute on function get_public_profile(uuid) to authenticated;

create or replace function get_public_profile_badges(p_user_id uuid)
returns table (sku text, name text, points bigint)
language sql
stable
security definer
set search_path = public
as $$
  select p.sku, p.name,
    sum(si.quantity * coalesce(p.piece_count, 0) + coalesce(motor_si.quantity, 0) * 500)::bigint as points
  from sale_items si
  join sales s on s.id = si.sale_id and s.status in ('pago', 'enviado', 'entregue')
  join products p on p.id = si.product_id and p.category <> 'motor'
  left join sale_items motor_si
    on motor_si.sale_id = si.sale_id and motor_si.product_id = p.motor_product_id
  where s.customer_contact = (select email from auth.users where id = p_user_id)
    and exists (select 1 from customer_profiles cp where cp.user_id = p_user_id and cp.public_profile)
  group by p.sku, p.name
  order by points desc;
$$;

grant execute on function get_public_profile_badges(uuid) to authenticated;

create or replace function get_public_profile_photos(p_user_id uuid)
returns table (
  id uuid,
  product_id uuid,
  product_name text,
  photo_url text,
  likes_count bigint,
  liked_by_me boolean,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select sp.id, sp.product_id, p.name, sp.photo_url,
    (select count(*) from set_photo_likes l where l.photo_id = sp.id),
    exists (select 1 from set_photo_likes l where l.photo_id = sp.id and l.user_id = auth.uid()),
    sp.created_at
  from set_photos sp
  join products p on p.id = sp.product_id
  where sp.user_id = p_user_id
    and sp.status = 'aprovado'
    and exists (select 1 from customer_profiles cp where cp.user_id = p_user_id and cp.public_profile)
  order by sp.created_at desc;
$$;

grant execute on function get_public_profile_photos(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. "Ver sets" no ranking — get_leaderboard ganha o user_id de quem tem
-- perfil público (null pra quem não tem conta ainda ou não deixou
-- público), pra o front saber quando mostrar o link.
-- ---------------------------------------------------------------------------
-- Postgres não deixa CREATE OR REPLACE mudar as colunas de retorno de uma
-- função existente (ganhou a coluna public_user_id) — precisa apagar antes.
drop function if exists get_leaderboard(integer);

create function get_leaderboard(p_limit integer default 10)
returns table (rank_position bigint, display_name text, total_points bigint, is_you boolean, public_user_id uuid)
language sql
stable
security definer
set search_path = public
as $$
  with ranked as (
    select customer_email, total_points,
      row_number() over (order by total_points desc, customer_email) as rank_position
    from customer_total_points
  ),
  with_profile as (
    select r.*, u.id as uid, coalesce(cp.public_profile, false) as is_public
    from ranked r
    left join auth.users u on u.email = r.customer_email
    left join customer_profiles cp on cp.user_id = u.id
  ),
  top as (
    select rank_position, get_display_name(customer_email) as display_name, total_points,
      (customer_email = auth.jwt() ->> 'email') as is_you,
      case when is_public then uid else null end as public_user_id
    from with_profile
    order by rank_position
    limit p_limit
  ),
  me as (
    select rank_position, get_display_name(customer_email) as display_name, total_points, true as is_you,
      case when is_public then uid else null end as public_user_id
    from with_profile
    where customer_email = auth.jwt() ->> 'email' and rank_position > p_limit
  )
  select * from top
  union all
  select * from me
  order by rank_position;
$$;

grant execute on function get_leaderboard(integer) to authenticated;

-- ---------------------------------------------------------------------------
-- 5b. Moderação no painel — set_photos sozinha não tem nome do produto nem
-- e-mail do cliente (auth.users não é consultável direto via REST), então
-- a equipe precisa desta função pra ver a fila de aprovação com contexto.
-- A aprovação/rejeição em si continua via UPDATE direto em set_photos
-- (já liberado pra staff pela policy "staff can moderate set photos").
-- ---------------------------------------------------------------------------
create or replace function get_set_photos_for_moderation()
returns table (
  id uuid,
  photo_url text,
  status text,
  created_at timestamptz,
  product_name text,
  customer_email text
)
language sql
stable
security definer
set search_path = public
as $$
  select sp.id, sp.photo_url, sp.status, sp.created_at, p.name, u.email
  from set_photos sp
  join products p on p.id = sp.product_id
  join auth.users u on u.id = sp.user_id
  where is_staff()
  order by sp.created_at desc;
$$;

grant execute on function get_set_photos_for_moderation() to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Bucket de armazenamento das fotos (mesmo padrão de testimonial-photos
-- em 080_testimonials.sql) — só quem está logado pode enviar.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'set-photos',
  'set-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "authenticated can upload set photos" on storage.objects
  for insert
  with check (bucket_id = 'set-photos' and auth.role() = 'authenticated');

create policy "public can read set photos" on storage.objects
  for select
  using (bucket_id = 'set-photos');
