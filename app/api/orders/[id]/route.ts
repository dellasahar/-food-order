import { prisma } from '@/lib/prisma'
import { fail, ok, parseId } from '@/lib/api'

export const runtime = 'edge'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const raw = (await params).id
  const id = parseId(raw)
  const order = id
    ? await prisma.order.findUnique({ where: { id }, include: { items: { include: { product: true } } } })
    : await prisma.order.findUnique({ where: { orderNumber: raw }, include: { items: { include: { product: true } } } })
  return order ? ok(order, 200, 'Order fetched.') : fail('Order not found.', 404)
}
