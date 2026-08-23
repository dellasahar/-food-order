import { prisma } from '@/lib/prisma'
import { fail, ok, parseId, readJson } from '@/lib/api'

function fields(body: Record<string, unknown>) {
  if (typeof body.name !== 'string' || !body.name.trim()) return 'Product name is required.'
  if (typeof body.price !== 'number' || !Number.isInteger(body.price) || body.price <= 0) return 'Price must be a positive integer.'
  if (typeof body.stock !== 'number' || !Number.isInteger(body.stock) || body.stock < 0) return 'Stock must be a non-negative integer.'
  return null
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = parseId((await params).id)
  if (!id) return fail('Invalid product id.', 400)
  const product = await prisma.product.findUnique({ where: { id } })
  return product ? ok(product, 200, 'Product fetched.') : fail('Product not found.', 404)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = parseId((await params).id)
  if (!id) return fail('Invalid product id.', 400)
  const body = await readJson<Record<string, unknown>>(request)
  if (body.error) return body.error
  const error = fields(body.value)
  if (error) return fail(error, 400)
  try {
    const product = await prisma.product.update({ where: { id }, data: { name: body.value.name as string, price: body.value.price as number, stock: body.value.stock as number, category: typeof body.value.category === 'string' ? body.value.category : undefined, description: typeof body.value.description === 'string' ? body.value.description : undefined, image: typeof body.value.image === 'string' ? body.value.image : undefined } })
    return ok(product, 200, 'Product updated.')
  } catch { return fail('Product not found.', 404) }
}

export const PATCH = PUT

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = parseId((await params).id)
  if (!id) return fail('Invalid product id.', 400)
  try { await prisma.product.delete({ where: { id } }); return ok(null, 200, 'Product deleted.') }
  catch { return fail('Product not found.', 404) }
}
