import { useEffect, useMemo, useState } from 'react'
import { getSetPhotosForModeration, updateSetPhotoStatus } from '@/lib/api'
import { Badge, Card, PageHeader } from '@/components/ui'
import type { SetPhotoModeration, SetPhotoStatus } from '@/types/domain'

const statusTone: Record<SetPhotoStatus, 'muted' | 'good' | 'warning' | 'critical' | 'info'> = {
  pendente: 'warning',
  aprovado: 'good',
  rejeitado: 'critical',
}

export function FotosSets() {
  const [photos, setPhotos] = useState<SetPhotoModeration[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'todos' | SetPhotoStatus>('pendente')

  const reload = () => {
    getSetPhotosForModeration().then((p) => {
      setPhotos(p)
      setLoading(false)
    })
  }

  useEffect(reload, [])

  const changeStatus = async (id: string, status: SetPhotoStatus) => {
    await updateSetPhotoStatus(id, status)
    reload()
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return photos.filter((p) => {
      if (statusFilter !== 'todos' && p.status !== statusFilter) return false
      if (q && !`${p.customer_email} ${p.product_name}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [photos, search, statusFilter])

  if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Carregando...</div>

  const pendingCount = photos.filter((p) => p.status === 'pendente').length

  return (
    <div>
      <PageHeader
        title="Fotos de colecionadores"
        description="Fotos dos sets montados enviadas pelos clientes — aprove pra ficar visível no perfil público (ranking dos Selos Digitais)"
      />

      <div className="mb-4 mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por cliente ou set..."
          className="w-full rounded-lg border px-3 py-2 text-sm sm:w-80"
          style={{ borderColor: 'var(--border-hairline)', background: 'transparent', color: 'var(--text-primary)' }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: 'var(--border-hairline)', background: 'var(--surface-1)', color: 'var(--text-primary)' }}
        >
          <option value="todos">Todos os status</option>
          {(['pendente', 'aprovado', 'rejeitado'] as SetPhotoStatus[]).map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
        {pendingCount > 0 && (
          <span className="text-xs" style={{ color: 'var(--status-warning)' }}>
            {pendingCount} pendente{pendingCount > 1 ? 's' : ''} de revisão
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.length === 0 ? (
          <Card className="col-span-full py-6 text-center text-sm">
            <span style={{ color: 'var(--text-muted)' }}>Nenhuma foto encontrada.</span>
          </Card>
        ) : (
          filtered.map((p) => (
            <Card key={p.id} className="flex flex-col gap-2.5">
              <a href={p.photo_url} target="_blank" rel="noreferrer">
                <img src={p.photo_url} alt={p.product_name} className="h-40 w-full rounded-md object-cover" />
              </a>
              <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {p.product_name}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {p.customer_email}
              </div>
              <div className="flex items-center justify-between">
                <Badge tone={statusTone[p.status]}>{p.status}</Badge>
                <select
                  value={p.status}
                  onChange={(e) => changeStatus(p.id, e.target.value as SetPhotoStatus)}
                  className="rounded-md border-0 bg-transparent text-xs"
                  style={{ color: 'inherit' }}
                >
                  {(['pendente', 'aprovado', 'rejeitado'] as SetPhotoStatus[]).map((st) => (
                    <option key={st} value={st} style={{ background: 'var(--surface-1)', color: 'var(--text-primary)' }}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
