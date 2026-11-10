// Marcos de gamificação (não são selos, só títulos/benefícios por
// pontuação acumulada) — fonte única usada em Minha Conta e no perfil
// público do colecionador. O desconto de cada um é sempre recalculado de
// verdade no banco (activate_club_benefit); esta lista é só pra exibir.
export const CLUBS = [
  { threshold: 10000, name: 'Clube 10K', title: 'Mecânico de Elite', discountPct: 5 },
  { threshold: 25000, name: 'Clube 25K', title: 'Engenheiro de Pista', discountPct: 10 },
  { threshold: 50000, name: 'Clube 50K', title: 'Projetista Chefe', discountPct: 20 },
  { threshold: 75000, name: 'Clube 75K', title: 'Estrategista Supremo', discountPct: 35 },
  { threshold: 100000, name: 'Clube 100K', title: 'Chefe de Equipe', discountPct: 50 },
]

export function clubForPoints(points: number) {
  return [...CLUBS].reverse().find((c) => points >= c.threshold) ?? null
}
