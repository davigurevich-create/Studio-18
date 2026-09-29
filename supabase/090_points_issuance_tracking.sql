-- Studio 18 — sistema de pontos: como o portal BOB (selos digitais) não
-- tem API, a emissão do selo com os pontos pro cliente é sempre manual, lá
-- no painel do BOB. O customer_points_ledger já registra automaticamente
-- quando um cliente ganha pontos (hoje só o bônus de depoimento) — falta
-- só um jeito da equipe saber quais créditos ainda não viraram selo
-- emitido, pra não esquecer nem duplicar.
-- Rode no SQL Editor do Supabase.

alter table customer_points_ledger add column if not exists issued_at timestamptz;

-- A policy de select autenticado já existe (migration 080) — falta a de
-- update, pra equipe poder marcar "emitido" depois de lançar no BOB.
create policy "authenticated can mark points as issued" on customer_points_ledger
  for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
