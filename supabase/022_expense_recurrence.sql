-- Studio 18 — classifica cada despesa como pontual ou recorrente (mensal
-- ou anual), para diferenciar gastos únicos de compromissos fixos. Rode no
-- SQL Editor do Supabase.
alter table expenses add column if not exists recurrence text not null default 'pontual';

alter table expenses drop constraint if exists expenses_recurrence_check;
alter table expenses add constraint expenses_recurrence_check
  check (recurrence in ('pontual', 'mensal', 'anual'));
