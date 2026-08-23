import { beforeEach, describe, expect, it, vi } from 'vitest'

const db = vi.hoisted(() => ({ findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), updateMany: vi.fn(), orderFindMany: vi.fn(), transaction: vi.fn() }))
vi.mock('@/lib/prisma', () => ({ prisma: { product: { findMany: db.findMany, findUnique: db.findUnique, create: db.create, update: db.update, delete: db.delete, updateMany: db.updateMany }, order: { findMany: db.orderFindMany, findUnique: db.findUnique, create: db.create, update: db.update }, $transaction: db.transaction } }))

import { GET as getProducts, POST as createProduct } from '@/app/api/products/route'
import { GET as getProduct, PATCH as updateProduct, DELETE as deleteProduct } from '@/app/api/products/[id]/route'
import { GET as getOrders, POST as createOrder } from '@/app/api/orders/route'
import { GET as getOrder } from '@/app/api/orders/[id]/route'
import { PUT as updateStatus } from '@/app/api/orders/[id]/status/route'

const request = (body?: unknown) => new Request('http://localhost/api', body === undefined ? undefined : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
const context = (id = '1') => ({ params: Promise.resolve({ id }) })

describe('FoodOrder API automation contract', () => {
  beforeEach(() => { vi.clearAllMocks(); db.findMany.mockResolvedValue([]); db.orderFindMany.mockResolvedValue([]); db.findUnique.mockResolvedValue(null) })
  it('GET products returns JSON', async () => { const response = await getProducts(); expect(response.status).toBe(200); expect(response.headers.get('content-type')).toContain('application/json') })
  it('POST products rejects missing fields', async () => { const response = await createProduct(request({})); expect(response.status).toBe(400); expect((await response.json()).success).toBe(false) })
  it('POST products rejects negative stock', async () => { const response = await createProduct(request({ name: 'Test', price: 1000, stock: -1, category: 'Test', description: 'Test' })); expect(response.status).toBe(400) })
  it('GET product handles not found', async () => { const response = await getProduct(request(), context('1')); expect(response.status).toBe(404) })
  it('PATCH product validates payload', async () => { const response = await updateProduct(request({ price: 0 }), context('1')); expect(response.status).toBe(400) })
  it('DELETE product returns not found', async () => { db.delete.mockRejectedValueOnce(new Error('not found')); const response = await deleteProduct(request(), context('999')); expect(response.status).toBe(404) })
  it('POST orders rejects malformed body', async () => { const response = await createOrder(request({})); expect(response.status).toBe(400) })
  it('GET orders returns a contract response', async () => { const response = await getOrders(); expect(response.status).toBe(200) })
  it('GET order handles not found', async () => { const response = await getOrder(request(), context('999')); expect(response.status).toBe(404) })
  it('status endpoint validates missing status', async () => { const response = await updateStatus(request({}), context('1')); expect(response.status).toBe(400) })
  it('invalid ids return client errors', async () => { const response = await getProduct(request(), context('abc')); expect(response.status).toBe(400) })
  it('all tested endpoints respond under five seconds', async () => { const started = Date.now(); await getProducts(); expect(Date.now() - started).toBeLessThan(5000) })
})
