import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export interface CartLine {
  productId: string
  quantity: number
}

interface Toast {
  id: number
  message: string
}

interface CartContextValue {
  lines: CartLine[]
  totalCount: number
  addItem: (productId: string, quantity?: number, productName?: string) => void
  removeItem: (productId: string) => void
  setQuantity: (productId: string, quantity: number) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

const STORAGE_KEY = 'studio18_cart'

function loadCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => loadCart())
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextToastId = useRef(0)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
  }, [lines])

  const addItem = (productId: string, quantity = 1, productName?: string) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === productId)
      if (existing) {
        return prev.map((l) => (l.productId === productId ? { ...l, quantity: l.quantity + quantity } : l))
      }
      return [...prev, { productId, quantity }]
    })

    if (productName) {
      const id = nextToastId.current++
      setToasts((prev) => [...prev, { id, message: `${productName} adicionado ao carrinho` }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 2800)
    }
  }

  const removeItem = (productId: string) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId))
  }

  const setQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(productId)
      return
    }
    setLines((prev) => prev.map((l) => (l.productId === productId ? { ...l, quantity } : l)))
  }

  const clear = () => setLines([])

  const totalCount = lines.reduce((t, l) => t + l.quantity, 0)

  return (
    <CartContext.Provider value={{ lines, totalCount, addItem, removeItem, setQuantity, clear }}>
      {children}

      <div className="pointer-events-none fixed inset-x-0 top-20 z-[60] flex flex-col items-center gap-2 px-4">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm shadow-lg"
              style={{ borderColor: 'var(--gold-dim)', background: 'var(--carbon-1)', color: 'var(--ink)' }}
            >
              <span style={{ color: 'var(--gold)' }}>✓</span>
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart precisa estar dentro de um CartProvider')
  return ctx
}
