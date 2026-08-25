-- Studio 18 — libera o acesso dos sócios ao painel de gestão. Rode no SQL
-- Editor do Supabase DEPOIS de criar as contas de cada um em
-- Authentication → Users → Add user (com esses mesmos e-mails).

insert into staff_members (user_id, email)
select id, email from auth.users where email = 'sudjasmaniwan@gmail.com'
on conflict (user_id) do nothing;

insert into staff_members (user_id, email)
select id, email from auth.users where email = 'rubens@brasilopenbadge.com.br'
on conflict (user_id) do nothing;
