import { prisma } from '@/lib/prisma'
import { fail, ok, readJson } from '@/lib/api'

function validateProduct(input: Record<string, unknown>) {
  if (typeof input.name !== 'string' || !input.name.trim()) return 'Product name is required.'
  if (typeof input.price !== 'number' || !Number.isInteger(input.price) || input.price <= 0) return 'Price must be a positive integer.'
  if (typeof input.stock !== 'number' || !Number.isInteger(input.stock) || input.stock < 0) return 'Stock must be a non-negative integer.'
  if (typeof input.category !== 'string' || !input.category.trim()) return 'Category is required.'
  if (typeof input.description !== 'string') return 'Description is required.'
  return null
}

export async function GET() {
  try { return ok(await prisma.product.findMany({ orderBy: { id: 'asc' } }), 200, 'Products fetched.') }
  catch { return fail('Database unavailable.', 500) }
}

export async function POST(request: Request) {
  const body = await readJson<Record<string, unknown>>(request)
  if (body.error) return body.error
  const error = validateProduct(body.value)
  if (error) return fail(error, 400)
  try {
    const product = await prisma.product.create({ data: { name: body.value.name as string, price: body.value.price as number, stock: body.value.stock as number, category: body.value.category as string, description: body.value.description as string, image: typeof body.value.image === 'string' ? body.value.image : '' } })
    return ok(product, 201, 'Product created.')
  } catch { return fail('Could not create product.', 500) }
}
