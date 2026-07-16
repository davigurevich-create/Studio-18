-- Studio 18 — log de auditoria das ações administrativas do painel de gestão.
-- Rode no SQL Editor do Supabase.
--
-- Só é possível INSERIR e LER — ninguém (nem autenticado) pode editar ou
-- apagar uma entrada já registrada, para o log ser confiável como histórico.

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor_email text not null,
  action text not null check (action in ('criar', 'editar', 'excluir')),
  entity text not null,
  entity_id text,
  summary text not null
);

alter table audit_log enable row level security;

create policy "authenticated can insert audit log" on audit_log
  for insert
  with check (auth.role() = 'authenticated');

create policy "authenticated can read audit log" on audit_log
  for select
  using (auth.role() = 'authenticated');
