import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Award, Heart, Lock, Trophy } from 'lucide-react'
import {
  getPublicProfile,
  getPublicProfileBadges,
  getPublicProfilePhotos,
  toggleSetPhotoLike,
  type PublicProfile,
  type PublicBadge,
  type PublicSetPhoto,
} from '@/lib/api'
import { clubForPoints } from '@/lib/clubs'

function BadgeImage({ sku, name }: { sku: string; name: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full"
        style={{ background: 'linear-gradient(135deg, var(--gold-bright), var(--gold))' }}
      >
        <Award size={22} strokeWidth={2} style={{ color: '#1a1206' }} />
      </div>
    )
  }
  return (
    <img
      src={`/selos/${sku}.png`}
      alt={`Selo — ${name}`}
      className="h-12 w-12 rounded-full object-cover"
      onError={() => setFailed(true)}
    />
  )
}

function PhotoCard({ photo, onToggleLike }: { photo: PublicSetPhoto; onToggleLike: (id: string) => void }) {
  return (
    <div className="overflow-hidden rounded-xl border" style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-2)' }}>
      <img src={photo.photoUrl} alt={photo.productName} className="h-48 w-full object-cover" />
      <div className="flex items-center justify-between px-3 py-2.5">
        <span className="text-xs" style={{ color: 'var(--ink-secondary)' }}>
          {photo.productName}
        </span>
        <button
          type="button"
          onClick={() => onToggleLike(photo.id)}
          className="flex items-center gap-1.5 text-xs font-medium"
          style={{ color: photo.likedByMe ? 'var(--gold-bright)' : 'var(--ink-muted)' }}
        >
          <Heart size={14} strokeWidth={2} fill={photo.likedByMe ? 'var(--gold-bright)' : 'none'} />
          {photo.likesCount}
        </button>
      </div>
    </div>
  )
}

export function Colecionador() {
  const { userId } = useParams<{ userId: string }>()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [badges, setBadges] = useState<PublicBadge[]>([])
  const [photos, setPhotos] = useState<PublicSetPhoto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    Promise.all([getPublicProfile(userId), getPublicProfileBadges(userId), getPublicProfilePhotos(userId)]).then(
      ([p, b, ph]) => {
        setProfile(p)
        setBadges(b)
        setPhotos(ph)
        setLoading(false)
      },
    )
  }, [userId])

  const handleToggleLike = async (photoId: string) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, likedByMe: !p.likedByMe, likesCount: p.likesCount + (p.likedByMe ? -1 : 1) } : p)),
    )
    try {
      await toggleSetPhotoLike(photoId)
    } catch {
      // reverte se der errado — mesma reconciliação simples de qualquer toggle otimista
      setPhotos((prev) =>
        prev.map((p) => (p.id === photoId ? { ...p, likedByMe: !p.likedByMe, likesCount: p.likesCount + (p.likedByMe ? -1 : 1) } : p)),
      )
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-6 pb-24 pt-32 text-center">
        <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>
          Carregando...
        </p>
      </div>
    )
  }

  if (!profile?.isPublic) {
    return (
      <div className="mx-auto max-w-md px-6 pb-24 pt-32 text-center">
        <div
          className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: 'var(--carbon-2)', border: '1px solid var(--gold-dim)' }}
        >
          <Lock size={22} strokeWidth={2} style={{ color: 'var(--gold-bright)' }} />
        </div>
        <h1 className="mb-2 text-xl font-medium">Perfil privado</h1>
        <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>
          Esse colecionador ainda não deixou a coleção visível pra outros colecionadores.
        </p>
        <Link to="/badges#ranking" className="mt-6 inline-block text-sm underline" style={{ color: 'var(--gold-bright)' }}>
          Voltar pro ranking
        </Link>
      </div>
    )
  }

  const club = clubForPoints(profile.totalPoints)

  return (
    <div className="mx-auto max-w-4xl px-6 pb-24 pt-32">
      <div className="mb-10 text-center">
        <p className="eyebrow mb-2">Perfil de colecionador</p>
        <h1 className="mb-3 text-3xl font-medium">{profile.displayName}</h1>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span
            className="flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium"
            style={{ borderColor: 'var(--gold-dim)', color: 'var(--gold-bright)' }}
          >
            <Trophy size={14} strokeWidth={2} />
            {profile.totalPoints.toLocaleString('pt-BR')} pontos
          </span>
          {club && (
            <span className="rounded-full px-3.5 py-1.5 text-sm font-medium" style={{ background: 'var(--gold-wash)', color: 'var(--gold-bright)' }}>
              {club.name} — {club.title}
            </span>
          )}
        </div>
      </div>

      <h2 className="mb-3 text-sm font-semibold" style={{ color: 'var(--ink)' }}>
        Selos conquistados
      </h2>
      {badges.length === 0 ? (
        <p className="mb-10 text-sm" style={{ color: 'var(--ink-muted)' }}>
          Nenhum selo ainda.
        </p>
      ) : (
        <div className="mb-10 grid grid-cols-3 gap-3 sm:grid-cols-5">
          {badges.map((b) => (
            <div
              key={b.sku}
              className="flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center"
              style={{ borderColor: 'var(--gold-dim)', background: 'var(--carbon-2)' }}
            >
              <BadgeImage sku={b.sku} name={b.name} />
              <p className="text-[11px] font-medium leading-snug" style={{ color: 'var(--ink)' }}>
                {b.name}
              </p>
            </div>
          ))}
        </div>
      )}

      <h2 className="mb-3 text-sm font-semibold" style={{ color: 'var(--ink)' }}>
        Fotos dos sets
      </h2>
      {photos.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>
          Esse colecionador ainda não enviou fotos.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((p) => (
            <PhotoCard key={p.id} photo={p} onToggleLike={handleToggleLike} />
          ))}
        </div>
      )}
    </div>
  )
}
