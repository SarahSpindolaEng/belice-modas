'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from 'react'
import type { Product, Size, ColorOption } from '@/lib/products'

export interface CartItem {
  product: Product
  size: Size
  quantity: number
  color?: ColorOption
  image?: string
}

export interface FavoriteItem {
  product: Product
  size?: Size
  color?: ColorOption
  image?: string
}

interface CartContextValue {
  items: CartItem[]
  favorites: FavoriteItem[]
  addToCart: (product: Product, size: Size, quantity?: number, color?: ColorOption, image?: string) => void
  removeFromCart: (productId: string, size: Size) => void
  updateQuantity: (productId: string, size: Size, quantity: number) => void
  clearCart: () => void
  toggleFavorite: (product: Product, size?: Size, color?: ColorOption, image?: string) => void
  removeFavorite: (productId: string) => void
  isFavorite: (productId: string) => boolean
  itemCount: number
  subtotal: number
}

const CART_KEY = 'belice_cart'
const FAV_KEY = 'belice_favorites'

function loadCart(): CartItem[] {
  try {
    const raw = sessionStorage.getItem(CART_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveCart(items: CartItem[]) {
  try {
    sessionStorage.setItem(CART_KEY, JSON.stringify(items))
  } catch {}
}

function loadFavorites(): FavoriteItem[] {
  try {
    const raw = localStorage.getItem(FAV_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveFavorites(items: FavoriteItem[]) {
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify(items))
  } catch {}
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  // Carrega carrinho e favoritos após hidratação
  useEffect(() => {
    setItems(loadCart())
    setFavorites(loadFavorites())
    setHydrated(true)
  }, [])

  // Salva carrinho no sessionStorage sempre que mudar
  useEffect(() => {
    if (hydrated) saveCart(items)
  }, [items, hydrated])

  // Salva favoritos no localStorage sempre que mudar
  useEffect(() => {
    if (hydrated) saveFavorites(favorites)
  }, [favorites, hydrated])

  const addToCart = useCallback(
    (product: Product, size: Size, quantity = 1, color?: ColorOption, image?: string) => {
      setItems((prev) => {
        const existing = prev.find(
          (i) => i.product.id === product.id && i.size === size && i.color?.label === color?.label,
        )
        if (existing) {
          return prev.map((i) =>
            i.product.id === product.id && i.size === size && i.color?.label === color?.label
              ? { ...i, quantity: i.quantity + quantity }
              : i,
          )
        }
        return [...prev, { product, size, quantity, color, image: image ?? product.images[0] }]
      })
    },
    [],
  )

  const removeFromCart = useCallback((productId: string, size: Size) => {
    setItems((prev) =>
      prev.filter((i) => !(i.product.id === productId && i.size === size)),
    )
  }, [])

  const updateQuantity = useCallback(
    (productId: string, size: Size, quantity: number) => {
      setItems((prev) =>
        prev
          .map((i) =>
            i.product.id === productId && i.size === size
              ? { ...i, quantity: Math.max(1, quantity) }
              : i,
          )
          .filter((i) => i.quantity > 0),
      )
    },
    [],
  )

  const clearCart = useCallback(() => {
    setItems([])
    try { sessionStorage.removeItem(CART_KEY) } catch {}
  }, [])

  const toggleFavorite = useCallback(
    (product: Product, size?: Size, color?: ColorOption, image?: string) => {
      setFavorites((prev) => {
        const exists = prev.some((f) => f.product.id === product.id)
        if (exists) return prev.filter((f) => f.product.id !== product.id)
        return [...prev, { product, size, color, image: image ?? product.images[0] }]
      })
    },
    [],
  )

  const removeFavorite = useCallback((productId: string) => {
    setFavorites((prev) => prev.filter((f) => f.product.id !== productId))
  }, [])

  const isFavorite = useCallback(
    (productId: string) => favorites.some((f) => f.product.id === productId),
    [favorites],
  )

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items],
  )

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    [items],
  )

  const value = useMemo(
    () => ({
      items,
      favorites,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      toggleFavorite,
      removeFavorite,
      isFavorite,
      itemCount,
      subtotal,
    }),
    [
      items,
      favorites,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      toggleFavorite,
      removeFavorite,
      isFavorite,
      itemCount,
      subtotal,
    ],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
