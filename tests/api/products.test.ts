import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ findMany: vi.fn(), create: vi.fn() }))
vi.mock('@/lib/prisma', () => ({ prisma: { product: { findMany: mocks.findMany, create: mocks.create } } }))

import { GET, POST } from '@/app/api/products/route'

describe('products API', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.findMany.mockReset(); mocks.create.mockReset() })
  it('returns the standard success envelope', async () => { mocks.findMany.mockResolvedValue([{ id: 1, name: 'Nasi Goreng' }]); const response = await GET(); expect(response.status).toBe(200); expect(await response.json()).toMatchObject({ success: true, data: [{ id: 1 }] }) })
  it('rejects invalid product data', async () => { const response = await POST(new Request('http://localhost/api/products', { method: 'POST', body: JSON.stringify({ name: '', price: -1, stock: -2, category: '', description: '' }) })); expect(response.status).toBe(400); expect(mocks.create).not.toHaveBeenCalled() })
  it('creates valid products', async () => { mocks.create.mockResolvedValue({ id: 2, name: 'Es Teh' }); const response = await POST(new Request('http://localhost/api/products', { method: 'POST', body: JSON.stringify({ name: 'Es Teh', price: 5000, stock: 4, category: 'Minuman', description: 'Dingin' }) })); expect(response.status).toBe(201); expect((await response.json()).success).toBe(true) })
  it('rejects malformed JSON', async () => { const response = await POST(new Request('http://localhost/api/products', { method: 'POST', body: '{' })); expect(response.status).toBe(400) })
})
