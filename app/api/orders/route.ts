import { prisma } from '@/lib/prisma'
import { fail, ok, readJson } from '@/lib/api'
import { createOrder } from '@/lib/business'

export const runtime = 'nodejs'

export async function GET() {
  try { return ok(await prisma.order.findMany({ include: { items: { include: { product: true } } }, orderBy: { id: 'desc' } }), 200, 'Orders fetched.') }
  catch { return fail('Database unavailable.', 500) }
}

export async function POST(request: Request) {
  const body = await readJson<{ userId?: number; recipientName?: string; shippingAddress?: string; phone?: string; lines?: Array<{ productId: number; quantity: number }> }>(request)
  if (body.error) return body.error
  if (!Array.isArray(body.value.lines)) return fail('lines are required.', 400)

  let userId = body.value.userId
  if (!Number.isInteger(userId)) {
    const fallbackUser = await prisma.user.findFirst({ select: { id: true }, orderBy: { id: 'asc' } })
    if (!fallbackUser) return fail('No user found. Please seed users first.', 400)
    userId = fallbackUser.id
  }

  const products = await prisma.product.findMany({ where: { id: { in: body.value.lines.map((line) => line.productId) } }, select: { id: true, price: true, stock: true } })
  const result = createOrder({ isLoggedIn: true, recipientName: body.value.recipientName ?? '', shippingAddress: body.value.shippingAddress ?? '', phone: body.value.phone ?? '', lines: body.value.lines }, products)
  if (!result.valid) return fail(result.message, 400)

  try {
    const order = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({ data: { orderNumber: `ORD-${Date.now().toString().slice(-8)}`, userId, recipientName: body.value.recipientName!.trim(), shippingAddress: body.value.shippingAddress!.trim(), phone: body.value.phone!.trim(), total: result.total, items: { create: result.lines.map((line) => ({ productId: line.productId, quantity: line.quantity, price: line.price })) } }, include: { items: { include: { product: true } } } })
      for (const line of result.lines) await tx.product.updateMany({ where: { id: line.productId, stock: { gte: line.quantity } }, data: { stock: { decrement: line.quantity } } })
      return order
    })

    return ok(order, 201, 'Order created.')
  } catch { return fail('Could not create order.', 500) }
}
