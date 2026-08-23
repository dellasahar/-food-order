import { prisma } from '@/lib/prisma'
import { fail, ok, parseId, readJson } from '@/lib/api'
import { updateOrderStatus, type OrderStatus } from '@/lib/business'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!process.env.MYSQL_DATABASE_URL) return fail('Database belum dikonfigurasi. Set MYSQL_DATABASE_URL terlebih dahulu.', 500)
  const raw = (await params).id
  const id = parseId(raw)
  const body = await readJson<{ status?: OrderStatus }>(request)
  if (body.error) return body.error
  if (!body.value.status) return fail('Status is required.', 400)
  const order = id
    ? await prisma.order.findUnique({ where: { id } })
    : await prisma.order.findUnique({ where: { orderNumber: raw } })
  if (!order) return fail('Order not found.', 404)
  let status: OrderStatus
  try { status = updateOrderStatus(order.status, body.value.status) } catch (error) { return fail(error instanceof Error ? error.message : 'Invalid order status transition.', 400) }
  const updated = await prisma.order.update({ where: { id: order.id }, data: { status } })
  return ok(updated, 200, 'Order status updated.')
}
