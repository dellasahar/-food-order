export const MAX_QUANTITY = 10

export type CartLine = { productId: number; price: number; quantity: number; stock: number }
export type CheckoutInput = { recipientName: string; shippingAddress: string; phone: string; lines: CartLine[]; isLoggedIn: boolean }
export type OrderStatus = 'DRAFT' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'

export function validateQuantity(quantity: unknown, stock: number) {
  if (typeof quantity !== 'number' || !Number.isInteger(quantity)) return { valid: false, message: 'Quantity must be a whole number.' }
  if (quantity < 1) return { valid: false, message: 'Quantity must be at least 1.' }
  if (quantity > MAX_QUANTITY) return { valid: false, message: `Quantity cannot exceed ${MAX_QUANTITY}.` }
  if (quantity > stock) return { valid: false, message: 'Quantity cannot exceed available stock.' }
  return { valid: true, message: '' }
}

export function calculateCartTotal(lines: CartLine[]) {
  return lines.reduce((total, line) => total + line.price * line.quantity, 0)
}

export type AuthoritativeProduct = { id: number; price: number; stock: number }
export type CreateOrderInput = Omit<CheckoutInput, 'lines'> & { lines: Array<{ productId: number; quantity: number }> }

export function createOrder(input: CreateOrderInput, products: AuthoritativeProduct[]) {
  const productMap = new Map(products.map((product) => [product.id, product]))
  const lines: CartLine[] = []
  for (const line of input.lines) {
    const product = productMap.get(line.productId)
    if (!product) return { valid: false as const, message: 'Product not found.' }
    const quantityResult = validateQuantity(line.quantity, product.stock)
    if (!quantityResult.valid) return quantityResult
    lines.push({ ...line, price: product.price, stock: product.stock })
  }
  return validateCheckout({ ...input, lines })
    .valid ? { valid: true as const, total: calculateCartTotal(lines), lines } : validateCheckout({ ...input, lines })
}

export function validateCheckout(input: CheckoutInput) {
  if (!input.isLoggedIn) return { valid: false, message: 'You must be logged in.' }
  if (!input.lines.length) return { valid: false, message: 'Your cart is empty.' }
  for (const line of input.lines) { const result = validateQuantity(line.quantity, line.stock); if (!result.valid) return result }
  if (!input.recipientName.trim()) return { valid: false, message: 'Recipient name is required.' }
  if (!input.shippingAddress.trim()) return { valid: false, message: 'Shipping address is required.' }
  if (!input.phone.trim()) return { valid: false, message: 'Phone number is required.' }
  return { valid: true, message: '' }
}

const transitions: Record<OrderStatus, OrderStatus[]> = { DRAFT: ['CONFIRMED', 'CANCELLED'], CONFIRMED: ['COMPLETED', 'CANCELLED'], COMPLETED: [], CANCELLED: [] }
export function updateOrderStatus(current: OrderStatus, next: OrderStatus) {
  if (!transitions[current].includes(next)) throw new Error(`Invalid order status transition: ${current} → ${next}`)
  return next
}

export const formatCurrency = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)

export const demoProducts = [
  { id: 1, name: 'Nasi Goreng Spesial', price: 20000, stock: 10, category: 'Makanan', description: 'Nasi goreng gurih dengan telur, ayam suwir, dan sayuran segar.', image: '🍳' },
  { id: 2, name: 'Mie Ayam', price: 18000, stock: 8, category: 'Makanan', description: 'Mie kenyal dengan topping ayam berbumbu dan pangsit renyah.', image: '🍜' },
  { id: 3, name: 'Ayam Geprek', price: 22000, stock: 15, category: 'Makanan', description: 'Ayam crispy dengan sambal geprek pedas yang menggugah selera.', image: '🍗' },
  { id: 4, name: 'Es Teh', price: 5000, stock: 20, category: 'Minuman', description: 'Teh manis dingin yang menyegarkan untuk menemani makanmu.', image: '🧋' },
  { id: 5, name: 'Jus Alpukat', price: 12000, stock: 12, category: 'Minuman', description: 'Jus alpukat creamy dengan rasa manis alami dan segar.', image: '🥑' },
  { id: 6, name: 'Sate Ayam', price: 25000, stock: 14, category: 'Makanan', description: 'Potongan ayam bakar bumbu kacang dengan lontong hangat.', image: '🍢' },
  { id: 7, name: 'Bakso Urat', price: 19000, stock: 13, category: 'Makanan', description: 'Bakso urat kenyal dalam kuah kaldu gurih dan segar.', image: '🍲' },
  { id: 8, name: 'Nasi Uduk Komplit', price: 23000, stock: 11, category: 'Makanan', description: 'Nasi uduk wangi santan dengan lauk lengkap dan sambal.', image: '🍛' },
  { id: 9, name: 'Soto Ayam', price: 21000, stock: 10, category: 'Makanan', description: 'Soto ayam hangat dengan suwiran ayam dan telur rebus.', image: '🥣' },
  { id: 10, name: 'Kwetiau Goreng', price: 24000, stock: 9, category: 'Makanan', description: 'Kwetiau goreng dengan ayam, telur, dan sayur segar.', image: '🍝' },
  { id: 11, name: 'Cappuccino', price: 15000, stock: 16, category: 'Minuman', description: 'Kopi cappuccino creamy dengan aroma kopi yang kuat.', image: '☕' },
  { id: 12, name: 'Lemon Tea', price: 10000, stock: 18, category: 'Minuman', description: 'Teh lemon dingin dengan rasa asam manis menyegarkan.', image: '🍋' },
  { id: 13, name: 'Jus Jeruk', price: 11000, stock: 15, category: 'Minuman', description: 'Perasan jeruk segar kaya vitamin untuk menemani makan.', image: '🍊' },
  { id: 14, name: 'Thai Tea', price: 13000, stock: 17, category: 'Minuman', description: 'Minuman teh susu khas Thailand dengan rasa manis lembut.', image: '🧋' },
  { id: 15, name: 'Air Mineral', price: 4000, stock: 30, category: 'Minuman', description: 'Air mineral dingin untuk melengkapi menu pilihanmu.', image: '💧' },
]
