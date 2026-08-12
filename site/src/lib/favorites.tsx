import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '@/lib/auth'
import { addFavorite, getFavorites, removeFavorite, type MyFavorite } from '@/lib/api'

interface FavoritesContextValue {
  favorites: MyFavorite[]
  loading: boolean
  isFavorite: (productId: string) => boolean
  toggleFavorite: (productId: string) => Promise<void>
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null)

/**
 * Favoritos exigem login (não é uma lista anônima tipo o carrinho) — o
 * estado vive no Supabase, e este provider só recarrega quando a sessão
 * muda. Fica em volta do App, ao lado do AuthProvider, para o ícone de
 * coração no card do produto e a aba "Favoritos" em /conta compartilharem o
 * mesmo estado sem precisar recarregar a lista toda hora.
 */
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const [favorites, setFavorites] = useState<MyFavorite[]>([])
  const [loading, setLoading] = useState(false)

  const reload = () => {
    if (!session) {
      setFavorites([])
      return
    }
    setLoading(true)
    getFavorites()
      .then(setFavorites)
      .finally(() => setLoading(false))
  }

  useEffect(reload, [session])

  const isFavorite = (productId: string) => favorites.some((f) => f.product_id === productId)

  const toggleFavorite = async (productId: string) => {
    if (!session) return
    if (isFavorite(productId)) {
      setFavorites((prev) => prev.filter((f) => f.product_id !== productId))
      await removeFavorite(productId)
    } else {
      await addFavorite(productId)
      reload()
    }
  }

  return (
    <FavoritesContext.Provider value={{ favorites, loading, isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider')
  return ctx
}
