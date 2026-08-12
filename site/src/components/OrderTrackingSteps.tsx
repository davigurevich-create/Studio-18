const steps: { id: string; label: string }[] = [
  { id: 'pendente', label: 'Pedido registrado' },
  { id: 'pago', label: 'Pagamento confirmado' },
  { id: 'enviado', label: 'Enviado' },
  { id: 'entregue', label: 'Entregue' },
]

/**
 * Linha do tempo visual do pedido (registrado → pago → enviado → entregue)
 * — usada tanto em /rastreio (consulta pública por número + e-mail) quanto
 * na aba "Meus pedidos" da área logada, para não duplicar a mesma lógica de
 * passos em dois lugares.
 */
export function OrderTrackingSteps({ status }: { status: string }) {
  if (status === 'cancelado') {
    return (
      <p className="text-sm" style={{ color: '#e88b8b' }}>
        Este pedido foi cancelado.
      </p>
    )
  }

  const stepIndex = steps.findIndex((s) => s.id === status)

  return (
    <div className="flex flex-col gap-4">
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center gap-3">
          <div
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px]"
            style={{
              background: i <= stepIndex ? 'var(--gold)' : 'var(--carbon-3)',
              color: i <= stepIndex ? '#0a0a0a' : 'var(--ink-muted)',
            }}
          >
            {i <= stepIndex ? '✓' : ''}
          </div>
          <span className="text-sm" style={{ color: i <= stepIndex ? 'var(--ink)' : 'var(--ink-muted)' }}>
            {s.label}
          </span>
        </div>
      ))}
    </div>
  )
}
