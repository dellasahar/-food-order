'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  ArrowRight,
  Check,
  ChevronDown,
  LogOut,
  Minus,
  Package,
  Plus,
  ShoppingBag,
  Trash2,
  Utensils,
  X,
} from 'lucide-react'
import {
  demoProducts,
  formatCurrency,
  validateCheckout,
  validateQuantity,
} from '@/lib/business'

type CartItem = (typeof demoProducts)[number] & { quantity: number }
type OrderStatus = 'DRAFT' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'

type OrderState = {
  id: string
  status: OrderStatus
  recipientName: string
  address: string
  phone: string
  total: number
  items: CartItem[]
}

type ApiOrder = {
  id: number
  orderNumber: string
  status: OrderStatus
  recipientName: string
  shippingAddress: string
  phone: string
  total: number
  items: Array<{
    quantity: number
    price: number
    product?: {
      id: number
      name: string
      stock: number
      description: string
      category: string
      image: string
    }
  }>
}

const initialOrder: OrderState = {
  id: 'ORD-0001',
  status: 'CONFIRMED',
  recipientName: 'Dela Sahar',
  address: 'Jl.Malengkeri Raya No 14 AR Makassar',
  phone: '082346172694',
  total: 45000,
  items: [
    { ...demoProducts[0], quantity: 1 },
    { ...demoProducts[3], quantity: 1 },
    { ...demoProducts[4], quantity: 1 },
  ],
}

const AUTH_STORAGE_KEY = 'foodorder_logged_in'
const CART_STORAGE_KEY = 'foodorder_cart'
const LAST_ORDER_STORAGE_KEY = 'foodorder_last_order_number'
const LOCAL_ORDERS_STORAGE_KEY = 'foodorder_local_orders'

function mapApiOrderToOrderState(apiOrder: ApiOrder): OrderState {
  return {
    id: apiOrder.orderNumber,
    status: apiOrder.status,
    recipientName: apiOrder.recipientName,
    address: apiOrder.shippingAddress,
    phone: apiOrder.phone,
    total: apiOrder.total,
    items: apiOrder.items.map((line, index) => ({
      id: line.product?.id ?? -(index + 1),
      name: line.product?.name ?? `Produk ${index + 1}`,
      stock: line.product?.stock ?? 0,
      category: line.product?.category ?? 'Produk',
      description: line.product?.description ?? '',
      image: line.product?.image ?? '🍽️',
      price: line.price,
      quantity: line.quantity,
    })),
  }
}

function loadLocalOrders(): OrderState[] {
  if (typeof window === 'undefined') return []
  try {
    const saved = localStorage.getItem(LOCAL_ORDERS_STORAGE_KEY)
    return saved ? (JSON.parse(saved) as OrderState[]) : []
  } catch {
    return []
  }
}

function saveLocalOrders(orders: OrderState[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LOCAL_ORDERS_STORAGE_KEY, JSON.stringify(orders))
}

export default function FoodOrderApp() {
  const pathname = usePathname()
  const router = useRouter()

  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const [notice, setNotice] = useState('')
  const [order, setOrder] = useState<OrderState>(initialOrder)
  const [orderLoading, setOrderLoading] = useState(false)
  const [orderHistory, setOrderHistory] = useState<OrderState[]>([])

  const [checkout, setCheckout] = useState({
    recipientName: '',
    shippingAddress: '',
    phone: '',
  })
  const [checkoutError, setCheckoutError] = useState('')
  const [submittingOrder, setSubmittingOrder] = useState(false)

  const [statusMenu, setStatusMenu] = useState(false)

  useEffect(() => {
    setLoggedIn(localStorage.getItem(AUTH_STORAGE_KEY) === '1')
    setOrderHistory(loadLocalOrders())
  }, [])

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    if (loggedIn === null) return
    if (!loggedIn && pathname !== '/login') {
      router.replace('/login')
      return
    }
    if (loggedIn && pathname === '/login') {
      router.replace('/products')
      return
    }
    if (loggedIn && pathname === '/') {
      router.replace('/products')
    }
  }, [loggedIn, pathname, router])

  useEffect(() => {
    if (!pathname.startsWith('/orders/')) return

    const orderId = pathname.split('/').pop()
    if (!orderId) return

    const localOrder = loadLocalOrders().find((item) => item.id === orderId)
    if (localOrder) {
      setOrder(localOrder)
      setOrderLoading(false)
      return
    }

    let active = true
    setOrderLoading(true)

    fetch(`/api/orders/${orderId}`)
      .then(async (response) => {
        const payload = await response.json()
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.message ?? 'Gagal memuat data pesanan.')
        }
        if (!active) return

        const mapped = mapApiOrderToOrderState(payload.data as ApiOrder)
        setOrder(mapped)
        localStorage.setItem(LAST_ORDER_STORAGE_KEY, mapped.id)
      })
      .catch(() => {
        if (!active) return
        const localOrder = loadLocalOrders().find((item) => item.id === orderId)
        if (localOrder) {
          setOrder(localOrder)
        } else {
          setNotice('Data pesanan tidak dapat dimuat dari server.')
        }
      })
      .finally(() => {
        if (active) setOrderLoading(false)
      })

    return () => {
      active = false
    }
  }, [pathname])

  const addToCart = (product: (typeof demoProducts)[number]) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id)
      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: Math.min(item.stock, item.quantity + 1) }
            : item,
        )
      }
      return [...current, { ...product, quantity: 1 }]
    })
    setNotice(`${product.name} ditambahkan ke keranjang.`)
  }

  const updateQty = (id: number, quantity: number) => {
    const item = cart.find((i) => i.id === id)
    if (!item) return

    const result = validateQuantity(quantity, item.stock)
    if (!result.valid) {
      setNotice(result.message)
      return
    }

    setCart(cart.map((i) => (i.id === id ? { ...i, quantity } : i)))
  }

  const remove = (id: number) => setCart(cart.filter((i) => i.id !== id))
  const clearCart = () => {
    setCart([])
    setNotice('Keranjang berhasil dikosongkan.')
  }
  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  )

  const login = (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      setLoginError('Email dan password wajib diisi.')
      return
    }

    if (email !== 'user@foodorder.com' || password !== 'password123') {
      setLoginError('Email atau password salah.')
      return
    }

    localStorage.setItem(AUTH_STORAGE_KEY, '1')
    setLoggedIn(true)

    const lastOrder = localStorage.getItem(LAST_ORDER_STORAGE_KEY)
    if (lastOrder) {
      setOrder((prev) => ({ ...prev, id: lastOrder }))
    }
    setOrderHistory(loadLocalOrders())

    router.push('/products')
  }

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submittingOrder) return

    const result = validateCheckout({
      ...checkout,
      lines: cart.map((item) => ({
        productId: item.id,
        price: item.price,
        quantity: item.quantity,
        stock: item.stock,
      })),
      isLoggedIn: Boolean(loggedIn),
    })

    if (!result.valid) {
      setCheckoutError(result.message)
      return
    }

    setCheckoutError('')
    setSubmittingOrder(true)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 2500)
      let response: Response

      try {
        response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            recipientName: checkout.recipientName,
            shippingAddress: checkout.shippingAddress,
            phone: checkout.phone,
            lines: cart.map((item) => ({
              productId: item.id,
              quantity: item.quantity,
            })),
          }),
        })
      } finally {
        clearTimeout(timeoutId)
      }

      const payload = await response.json()
      if (!response.ok || !payload?.success) {
        const localOrder: OrderState = {
          id: `ORD-${Date.now().toString().slice(-8)}`,
          status: 'DRAFT',
          recipientName: checkout.recipientName,
          address: checkout.shippingAddress,
          phone: checkout.phone,
          total,
          items: cart,
        }
        const localOrders = [localOrder, ...loadLocalOrders()]
        saveLocalOrders(localOrders)
        setOrderHistory(localOrders)
        setOrder(localOrder)
        localStorage.setItem(LAST_ORDER_STORAGE_KEY, localOrder.id)
        setNotice('Pesanan berhasil dibuat. Keranjang tetap tersimpan untuk pesanan berikutnya.')
        router.push('/orders')
        return
      }

      const created = mapApiOrderToOrderState(payload.data as ApiOrder)
      const historyAfterCreate = [created, ...loadLocalOrders().filter((item) => item.id !== created.id)]
      saveLocalOrders(historyAfterCreate)
      setOrderHistory(historyAfterCreate)
      setOrder(created)
      localStorage.setItem(LAST_ORDER_STORAGE_KEY, created.id)
      setNotice('Pesanan berhasil dibuat. Keranjang tetap tersimpan untuk pesanan berikutnya.')
      router.push('/orders')
    } catch {
      const localOrder: OrderState = {
        id: `ORD-${Date.now().toString().slice(-8)}`,
        status: 'DRAFT',
        recipientName: checkout.recipientName,
        address: checkout.shippingAddress,
        phone: checkout.phone,
        total,
        items: cart,
      }
      const localOrders = [localOrder, ...loadLocalOrders()]
      saveLocalOrders(localOrders)
      setOrderHistory(localOrders)
      setOrder(localOrder)
      localStorage.setItem(LAST_ORDER_STORAGE_KEY, localOrder.id)
      setNotice('Pesanan berhasil dibuat. Keranjang tetap tersimpan untuk pesanan berikutnya.')
      router.push('/orders')
    } finally {
      setSubmittingOrder(false)
    }
  }

  const applyStatusLocally = (orderId: string, status: OrderStatus) => {
    const updatedOrders = loadLocalOrders().map((item) =>
      item.id === orderId ? { ...item, status } : item,
    )
    saveLocalOrders(updatedOrders)
    setOrderHistory(updatedOrders)
    setOrder((prev) => (prev.id === orderId ? { ...prev, status } : prev))
  }

  const updateOrderStatusById = async (orderId: string, status: OrderStatus) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      const payload = await response.json()
      if (!response.ok || !payload?.success) {
        applyStatusLocally(orderId, status)
        setStatusMenu(false)
        return
      }

      applyStatusLocally(orderId, status)
      setStatusMenu(false)
    } catch {
      applyStatusLocally(orderId, status)
      setStatusMenu(false)
    }
  }

  if (loggedIn === null) return null

  if (pathname === '/login') {
    return (
      <Login
        email={email}
        password={password}
        setEmail={setEmail}
        setPassword={setPassword}
        error={loginError}
        onSubmit={login}
      />
    )
  }

  if (!loggedIn) return null

  const productId = Number(pathname.split('/').pop())
  const product = demoProducts.find((item) => item.id === productId)

  return (
    <>
      <Header
        cartCount={cart.reduce((sum, i) => sum + i.quantity, 0)}
        onLogout={() => {
          localStorage.removeItem(AUTH_STORAGE_KEY)
          localStorage.removeItem(CART_STORAGE_KEY)
          localStorage.removeItem(LAST_ORDER_STORAGE_KEY)
          localStorage.removeItem(LOCAL_ORDERS_STORAGE_KEY)
          setOrderHistory([])
          setCart([])
          setLoggedIn(false)
          router.push('/login')
        }}
      />

      <main className="mx-auto min-h-[calc(100vh-72px)] max-w-6xl px-5 py-8 md:px-8">
        {notice && (
          <div
            className="mb-5 flex items-center justify-between rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary"
            role="status"
            data-testid="notice"
          >
            {notice}
            <button onClick={() => setNotice('')} aria-label="Tutup notifikasi">
              <X />
            </button>
          </div>
        )}

        {pathname === '/products' && <Products onAdd={addToCart} />}
        {pathname.startsWith('/products/') && (
          <ProductDetail product={product} onAdd={addToCart} />
        )}
        {pathname === '/cart' && (
          <Cart
            cart={cart}
            total={total}
            updateQty={updateQty}
            remove={remove}
            onClear={clearCart}
            onCheckout={() => router.push('/checkout')}
          />
        )}
        {pathname === '/checkout' && (
          <Checkout
            cart={cart}
            total={total}
            values={checkout}
            setValues={setCheckout}
            error={checkoutError}
            isSubmitting={submittingOrder}
            onSubmit={submitOrder}
          />
        )}
        {pathname === '/orders' && <OrderList orders={orderHistory} onStatus={updateOrderStatusById} />}
        {pathname.startsWith('/orders/') && (
          <OrderDetail
            order={order}
            loading={orderLoading}
            statusMenu={statusMenu}
            setStatusMenu={setStatusMenu}
            onStatus={(status: OrderStatus) => updateOrderStatusById(order.id, status)}
          />
        )}
      </main>
    </>
  )
}

function Header({
  cartCount,
  onLogout,
}: {
  cartCount: number
  onLogout: () => void
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-card/90 shadow-sm">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 md:px-8">
        <Link href="/products" className="flex items-center gap-3 font-semibold text-foreground">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Utensils />
          </span>
          <span className="text-xl">FoodOrder</span>
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href="/orders"
            className="hidden rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground sm:block"
          >
            Pesanan saya
          </Link>

          <Link
            href="/cart"
            className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Keranjang"
          >
            <ShoppingBag />
            {cartCount > 0 && (
              <span
                className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground"
                data-testid="cart-count"
              >
                {cartCount}
              </span>
            )}
          </Link>

          <button
            onClick={onLogout}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Logout"
          >
            <LogOut />
          </button>
        </nav>
      </div>
    </header>
  )
}

function OrderList({
  orders,
  onStatus,
}: {
  orders: OrderState[]
  onStatus: (id: string, status: OrderStatus) => Promise<void>
}) {
  const [statusFilter, setStatusFilter] = useState<'ALL' | OrderStatus>('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const filteredOrders = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()
    return orders.filter((entry) => {
      const byStatus = statusFilter === 'ALL' || entry.status === statusFilter
      const byKeyword =
        !keyword ||
        entry.id.toLowerCase().includes(keyword) ||
        entry.recipientName.toLowerCase().includes(keyword)
      return byStatus && byKeyword
    })
  }, [orders, searchTerm, statusFilter])

  if (!orders.length) {
    return (
      <Empty
        title="Belum ada pesanan"
        text="Pesanan yang sudah kamu buat akan muncul di sini."
        action="Mulai pesan"
        href="/products"
      />
    )
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Riwayat pesanan</h1>
          <p className="mt-2 text-muted-foreground">Pesanan terbaru ditampilkan paling atas.</p>
        </div>
        <Link
          href="/products"
          className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-muted"
        >
          Kembali ke menu pesanan
        </Link>
      </div>

      <div className="mt-5 grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-[1fr_auto]">
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cari nomor pesanan atau nama penerima"
          className="h-11 rounded-lg border border-input bg-background px-3 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'ALL' | OrderStatus)}
          className="h-11 rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="ALL">Semua status</option>
          <option value="DRAFT">DRAFT</option>
          <option value="CONFIRMED">CONFIRMED</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      </div>

      {filteredOrders.length === 0 && (
        <div className="mt-4 rounded-xl border border-dashed border-border bg-card px-4 py-6 text-sm text-muted-foreground">
          Tidak ada pesanan yang cocok dengan filter.
        </div>
      )}

      <div className="mt-6 flex flex-col gap-4">
        {filteredOrders.map((entry) => (
          <article
            key={entry.id}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <Link href={`/orders/${entry.id}`} className="text-sm text-muted-foreground hover:text-foreground">
                  {entry.id}
                </Link>
                <p className="mt-1 font-semibold">{entry.recipientName}</p>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {entry.status}
              </span>
            </div>

            <div className="mt-4 space-y-3 border-y border-border py-4">
              {entry.items.map((item, index) => (
                <div key={`${entry.id}-${item.id}-${index}`} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-xl">
                      {item.image}
                    </span>
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                  </div>
                  <strong className="text-sm text-foreground">{formatCurrency(item.price * item.quantity)}</strong>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <strong>Total {formatCurrency(entry.total)}</strong>
              <div className="flex items-center gap-2">
                {entry.status === 'DRAFT' && (
                  <>
                    <button
                      onClick={() => onStatus(entry.id, 'CONFIRMED')}
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                    >
                      Konfirmasi
                    </button>
                    <button
                      onClick={() => onStatus(entry.id, 'CANCELLED')}
                      className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive"
                    >
                      Batalkan
                    </button>
                  </>
                )}
                {entry.status === 'CONFIRMED' && (
                  <>
                    <button
                      onClick={() => onStatus(entry.id, 'COMPLETED')}
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                    >
                      Selesaikan
                    </button>
                    <button
                      onClick={() => onStatus(entry.id, 'CANCELLED')}
                      className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive"
                    >
                      Batalkan
                    </button>
                  </>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

function Login({ email, password, setEmail, setPassword, error, onSubmit }: any) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-5">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Utensils />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Selamat datang di FoodOrder</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Masuk untuk pesan makanan harian dengan cepat.
          </p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-5" data-testid="login-form">
          <label className="flex flex-col gap-2 text-sm font-medium">
            Email
            <input
              data-testid="login-email"
              className="h-11 rounded-lg border border-input bg-background px-3 outline-none ring-primary focus:ring-2"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@foodorder.com"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium">
            Password
            <input
              data-testid="login-password"
              className="h-11 rounded-lg border border-input bg-background px-3 outline-none ring-primary focus:ring-2"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password123"
            />
          </label>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <button
            data-testid="login-button"
            className="h-11 rounded-lg bg-primary font-medium text-primary-foreground hover:bg-primary/90"
          >
            Login
          </button>
        </form>

        <p className="mt-6 rounded-lg bg-muted p-3 text-center text-xs text-muted-foreground">
          Demo: user@foodorder.com / password123
        </p>
      </section>
    </main>
  )
}

function Products({ onAdd }: { onAdd: (p: any) => void }) {
  const [searchMenu, setSearchMenu] = useState('')
  const filteredProducts = useMemo(() => {
    const keyword = searchMenu.trim().toLowerCase()
    if (!keyword) return demoProducts
    return demoProducts.filter(
      (product) =>
        product.name.toLowerCase().includes(keyword) ||
        product.category.toLowerCase().includes(keyword) ||
        product.description.toLowerCase().includes(keyword),
    )
  }, [searchMenu])

  return (
    <div>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-sm font-medium text-primary">Menu hari ini</p>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Pesan cepat, makan tepat waktu.
          </h1>
          <p className="mt-2 text-muted-foreground">Pilih menu favoritmu dan langsung lanjut checkout.</p>
        </div>

        <Link
          href="/cart"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted"
        >
          Lihat keranjang <ArrowRight />
        </Link>
      </div>

      <div className="mb-5">
        <input
          value={searchMenu}
          onChange={(e) => setSearchMenu(e.target.value)}
          placeholder="Cari menu makanan atau minuman"
          className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm sm:max-w-md"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" data-testid="product-list">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} onAdd={onAdd} />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <p className="mt-5 text-sm text-muted-foreground">Menu tidak ditemukan. Coba kata kunci lain.</p>
      )}
    </div>
  )
}

function ProductCard({ product, onAdd }: any) {
  return (
    <article
      data-testid="product-card"
      className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <Link
        href={`/products/${product.id}`}
        className="flex h-40 items-center justify-center bg-muted text-7xl"
        aria-label={`Lihat detail ${product.name}`}
      >
        {product.image}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            {product.category}
          </span>
          <span className="text-xs text-muted-foreground">Stok {product.stock}</span>
        </div>

        <h2 className="font-semibold">{product.name}</h2>
        <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{product.description}</p>

        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <strong>{formatCurrency(product.price)}</strong>
          <button
            onClick={() => onAdd(product)}
            className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            data-testid="add-to-cart"
          >
            Tambah
          </button>
        </div>
      </div>
    </article>
  )
}

function ProductDetail({ product, onAdd }: any) {
  if (!product) {
    return <Empty title="Produk tidak ditemukan" text="Produk yang kamu cari tidak tersedia." />
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/products" className="text-sm text-muted-foreground hover:text-foreground">
        ← Kembali ke menu
      </Link>

      <section
        data-testid="product-detail"
        className="mt-5 grid overflow-hidden rounded-2xl border border-border bg-card md:grid-cols-2"
      >
        <div className="flex min-h-72 items-center justify-center bg-muted text-9xl">{product.image}</div>

        <div className="flex flex-col gap-5 p-7">
          <span className="w-fit rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            {product.category}
          </span>
          <h1 className="text-3xl font-semibold">{product.name}</h1>
          <p className="leading-7 text-muted-foreground">{product.description}</p>

          <div className="flex items-center justify-between border-y border-border py-4">
            <strong className="text-xl">{formatCurrency(product.price)}</strong>
            <span className="text-sm text-muted-foreground">Stok tersedia: {product.stock}</span>
          </div>

          <button
            onClick={() => onAdd(product)}
            className="h-11 rounded-lg bg-primary font-medium text-primary-foreground"
          >
            Tambah ke keranjang
          </button>
        </div>
      </section>
    </div>
  )
}

function Cart({ cart, total, updateQty, remove, onClear, onCheckout }: any) {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-semibold">Keranjang</h1>
      <p className="mt-2 text-muted-foreground">Periksa pesananmu sebelum checkout.</p>

      {!cart.length ? (
        <Empty
          title="Keranjang masih kosong"
          text="Yuk pilih makanan dari menu kami."
          action="Mulai belanja"
          href="/products"
        />
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {cart.map((item: CartItem) => (
            <div
              key={item.id}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
              data-testid={`cart-item-${item.id}`}
            >
              <div className="flex size-16 items-center justify-center rounded-lg bg-muted text-3xl">
                {item.image}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-medium">{item.name}</h2>
                <p className="text-sm text-muted-foreground">{formatCurrency(item.price)}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  data-testid="quantity-decrease"
                  className="rounded-md border p-1.5"
                  onClick={() => updateQty(item.id, item.quantity - 1)}
                  aria-label="Kurangi jumlah"
                >
                  <Minus />
                </button>
                <span className="w-6 text-center text-sm" data-testid={`quantity-${item.id}`}>
                  {item.quantity}
                </span>
                <button
                  className="rounded-md border p-1.5"
                  onClick={() => updateQty(item.id, item.quantity + 1)}
                  aria-label="Tambah jumlah"
                >
                  <Plus />
                </button>
              </div>

              <strong className="hidden w-24 text-right sm:block">
                {formatCurrency(item.price * item.quantity)}
              </strong>

              <button
                onClick={() => remove(item.id)}
                aria-label={`Hapus ${item.name}`}
                className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 />
              </button>
            </div>
          ))}

          <div className="mt-3 flex items-center justify-between rounded-xl bg-primary/10 p-5">
            <span className="font-medium">Total</span>
            <strong className="text-xl">{formatCurrency(total)}</strong>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/products"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-border bg-card px-4 font-medium text-foreground hover:bg-muted"
            >
              Kembali ke menu
            </Link>
            <button onClick={onCheckout} className="h-12 rounded-lg bg-primary font-medium text-primary-foreground">
              Lanjut ke checkout
            </button>
          </div>

          <button
            onClick={onClear}
            className="h-11 rounded-lg border border-destructive/25 bg-destructive/10 text-sm font-medium text-destructive hover:bg-destructive/15"
          >
            Kosongkan keranjang
          </button>
        </div>
      )}
    </div>
  )
}

function Checkout({ cart, total, values, setValues, error, isSubmitting, onSubmit }: any) {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl font-semibold">Checkout</h1>
      <p className="mt-2 text-muted-foreground">Lengkapi data pengiriman untuk membuat pesanan.</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Checkout hanya menampilkan pesanan yang sedang aktif. Pesanan sebelumnya tetap tersimpan di menu Pesanan saya.
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6"
          data-testid="checkout-form"
        >
          <label className="flex flex-col gap-2 text-sm font-medium">
            Nama penerima
            <input
              className="h-11 rounded-lg border border-input bg-background px-3"
              value={values.recipientName}
              onChange={(e) => setValues({ ...values, recipientName: e.target.value })}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium">
            Alamat pengiriman
            <textarea
              className="min-h-24 rounded-lg border border-input bg-background p-3"
              value={values.shippingAddress}
              onChange={(e) => setValues({ ...values, shippingAddress: e.target.value })}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium">
            Nomor telepon
            <input
              className="h-11 rounded-lg border border-input bg-background px-3"
              value={values.phone}
              onChange={(e) => setValues({ ...values, phone: e.target.value })}
            />
          </label>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <button
            disabled={isSubmitting}
            className="h-11 rounded-lg bg-primary font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-70"
            data-testid="checkout-submit"
          >
            {isSubmitting ? 'Membuat pesanan...' : 'Buat pesanan'}
          </button>
        </form>

        <aside className="h-fit rounded-2xl border border-border bg-card p-6">
          <h2 className="font-semibold">Ringkasan pesanan</h2>
          <div className="mt-4 flex flex-col gap-3">
            {cart.map((item: CartItem) => (
              <div className="flex justify-between gap-3 text-sm" key={item.id}>
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span>{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 flex justify-between border-t border-border pt-4 font-semibold">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </aside>
      </div>
    </div>
  )
}

function OrderDetail({ order, loading, statusMenu, setStatusMenu, onStatus }: any) {
  if (loading) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          Memuat detail pesanan...
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Link
            href="/products"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-muted"
          >
            Kembali ke menu pesanan
          </Link>
          <Link
            href="/cart"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-muted"
          >
            Buka keranjang
          </Link>
        </div>
      </div>
    )
  }

  const canChange = order.status === 'DRAFT' || order.status === 'CONFIRMED'
  const next = order.status === 'DRAFT' ? ['CONFIRMED', 'CANCELLED'] : ['COMPLETED', 'CANCELLED']

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Detail pesanan</p>
          <h1 className="mt-1 text-3xl font-semibold">{order.id}</h1>
          <Link href="/orders" className="mt-2 inline-block text-sm text-primary hover:underline">
            Lihat semua pesanan
          </Link>
        </div>

        <span
          className="rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
          data-testid="order-status"
        >
          {order.status}
        </span>
      </div>

      <section className="mt-6 rounded-2xl border border-border bg-card p-6">
        <div className="grid gap-5 border-b border-border pb-6 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Penerima</p>
            <p className="mt-1 font-medium">{order.recipientName}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Alamat</p>
            <p className="mt-1 font-medium">{order.address}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Telepon</p>
            <p className="mt-1 font-medium">{order.phone}</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 py-6">
          {order.items.map((item: CartItem, index: number) => (
            <div className="flex items-center justify-between gap-4" key={`${item.id}-${index}`}>
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-xl">
                  {item.image}
                </span>
                <span>
                  {item.name} × {item.quantity}
                </span>
              </div>

              <strong>{formatCurrency(item.price * item.quantity)}</strong>
            </div>
          ))}
        </div>

        <div className="flex justify-between border-t border-border pt-5 text-lg font-semibold">
          <span>Total</span>
          <span>{formatCurrency(order.total)}</span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Link
            href="/products"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-muted"
          >
            Kembali ke menu pesanan
          </Link>
          <Link
            href="/cart"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-muted"
          >
            Buka keranjang
          </Link>
        </div>

        {canChange && (
          <div className="relative mt-6">
            <button
              onClick={() => setStatusMenu(!statusMenu)}
              className="flex h-11 w-full items-center justify-between rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted"
            >
              Ubah status pesanan <ChevronDown />
            </button>

            {statusMenu && (
              <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-lg border border-border bg-card">
                {next.map((status: string) => (
                  <button
                    key={status}
                    onClick={() => onStatus(status)}
                    className="flex h-10 w-full items-center justify-between px-4 text-sm hover:bg-muted"
                  >
                    <span>{status}</span>
                    {order.status === status && <Check className="size-4" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

function Empty({ title, text, action, href }: any) {
  return (
    <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
      <Package className="text-muted-foreground" />
      <h2 className="mt-4 font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
      {action && (
        <Link href={href} className="mt-5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">
          {action}
        </Link>
      )}
    </div>
  )
}
