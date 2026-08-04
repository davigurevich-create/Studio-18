import { useEffect, useMemo, useState } from 'react'
import { getProducts, getRestockWaitlist, markRestockWaitlistNotified } from '@/lib/api'
import { Badge, Card, PageHeader } from '@/components/ui'
import type { Product, RestockWaitlistEntry } from '@/types/domain'

export function ListaEspera() {
  const [entries, setEntries] = useState<RestockWaitlistEntry[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const reload = () => {
    Promise.all([getRestockWaitlist(), getProducts()]).then(([w, p]) => {
      setEntries(w)
      setProducts(p)
      setLoading(false)
    })
  }

  useEffect(reload, [])

  const productName = (id: string) => products.find((p) => p.id === id)?.name ?? '—'

  const toggleNotified = async (entry: RestockWaitlistEntry) => {
    await markRestockWaitlistNotified(entry.id, !entry.notified)
    reload()
  }

  const filteredEntries = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return entries
    return entries.filter((e) => {
      const haystack = `${productName(e.product_id)} ${e.customer_name ?? ''} ${e.customer_email}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [entries, search, products])

  const byProduct = useMemo(() => {
    const counts = new Map<string, number>()
    for (const e of entries) {
      if (e.notified) continue
      counts.set(e.product_id, (counts.get(e.product_id) ?? 0) + 1)
    }
    return [...counts.entries()]
      .map(([productId, count]) => ({ productId, count }))
      .sort((a, b) => b.count - a.count)
  }, [entries])

  if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Carregando...</div>

  const pendingCount = entries.filter((e) => !e.notified).length

  return (
    <div>
      <PageHeader
        title="Lista de espera de reposição"
        description="Clientes que pediram para ser avisados quando um SKU esgotado voltar ao estoque"
      />

      {byProduct.length > 0 && (
        <Card className="mt-4">
          <h2 className="mb-3 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Demanda represada por SKU
          </h2>
          <div className="flex flex-col gap-2">
            {byProduct.map(({ productId, count }) => (
              <div key={productId} className="flex items-center justify-between text-sm">
                <span style={{ color: 'var(--text-primary)' }}>{productName(productId)}</span>
                <Badge tone="warning">
                  {count} {count === 1 ? 'pessoa aguardando' : 'pessoas aguardando'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="mb-4 mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por produto, cliente ou e-mail..."
          className="w-full rounded-lg border px-3 py-2 text-sm sm:w-80"
          style={{ borderColor: 'var(--border-hairline)', background: 'transparent', color: 'var(--text-primary)' }}
        />
        {pendingCount > 0 && (
          <span className="text-xs" style={{ color: 'var(--status-warning)' }}>
            {pendingCount} aguardando aviso
          </span>
        )}
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="text-left" style={{ color: 'var(--text-muted)' }}>
              <th className="pb-2 font-medium">Data</th>
              <th className="pb-2 font-medium">Produto</th>
              <th className="pb-2 font-medium">Cliente</th>
              <th className="pb-2 font-medium">Status</th>
              <th className="pb-2 font-medium">Ação</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  Nenhum registro encontrado.
                </td>
              </tr>
            ) : (
              filteredEntries.map((e) => (
                <tr key={e.id} className="border-t align-top" style={{ borderColor: 'var(--gridline)' }}>
                  <td className="py-2.5" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(e.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="py-2.5 font-medium" style={{ color: 'var(--text-primary)' }}>
                    {productName(e.product_id)}
                  </td>
                  <td className="py-2.5" style={{ color: 'var(--text-primary)' }}>
                    <div>{e.customer_name || '—'}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {e.customer_email}
                    </div>
                  </td>
                  <td className="py-2.5">
                    <Badge tone={e.notified ? 'good' : 'warning'}>{e.notified ? 'Avisado' : 'Aguardando'}</Badge>
                  </td>
                  <td className="py-2.5">
                    <button
                      onClick={() => toggleNotified(e)}
                      className="rounded-md border px-2.5 py-1 text-xs font-medium"
                      style={{ borderColor: 'var(--border-hairline)', color: 'var(--text-secondary)' }}
                    >
                      {e.notified ? 'Marcar como pendente' : 'Marcar como avisado'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
