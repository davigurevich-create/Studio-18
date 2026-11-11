import { flushSync } from 'react-dom'

// Transição "a foto do card vira a capa da página do produto" (e o caminho
// inverso), feita com a View Transitions API do navegador. O par de
// elementos é ligado pelo mesmo view-transition-name; como o nome precisa
// ser único na página, ele só é colocado no card clicado, na hora do clique.
export const COVER_TRANSITION_NAME = 'product-cover'

type StartViewTransition = (update: () => void | Promise<void>) => { finished: Promise<void> }

function getStarter(): StartViewTransition | null {
  const doc = document as Document & { startViewTransition?: StartViewTransition }
  if (typeof doc.startViewTransition !== 'function') return null
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null
  return doc.startViewTransition.bind(doc)
}

// espera curta via setTimeout — NÃO dá pra usar requestAnimationFrame aqui:
// o navegador pausa a renderização (e os rAF) enquanto o callback da
// transição não termina, então um rAF ali dentro nunca dispararia
const tick = (ms = 16) => new Promise<void>((resolve) => window.setTimeout(resolve, ms))

/**
 * Navega com a transição de capa. `source` é o elemento da foto na página
 * atual; `findTarget` (opcional) localiza a foto correspondente na página
 * NOVA, pra quando ela não tem o nome fixo no próprio componente (o card na
 * Home, na volta). Sem suporte do navegador, só navega.
 */
export function navigateWithCoverTransition(
  source: HTMLElement | null,
  navigate: () => void,
  findTarget?: () => HTMLElement | null,
) {
  const start = getStarter()
  if (!start || !source) {
    navigate()
    return
  }

  source.style.viewTransitionName = COVER_TRANSITION_NAME
  let target: HTMLElement | null = null

  const transition = start(async () => {
    flushSync(navigate)
    // a página antiga saiu do DOM junto com o `source`; se ele ainda existir
    // (mesma rota), tira o nome pra não duplicar com o destino
    source.style.viewTransitionName = ''
    if (!findTarget) {
      await tick()
      return
    }
    // o destino pode levar alguns frames pra existir e pra página rolar até
    // ele (Home.tsx restaura a rolagem até o card) — espera um pouco, mas
    // nunca segura a tela congelada por mais que ~350ms
    const deadline = performance.now() + 350
    while (performance.now() < deadline) {
      await tick()
      target = findTarget()
      if (target) break
    }
    if (target) {
      target.style.viewTransitionName = COVER_TRANSITION_NAME
      await tick()
    }
  })

  transition.finished
    .catch(() => {})
    .finally(() => {
      if (target) target.style.viewTransitionName = ''
    })
}
