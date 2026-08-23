import { describe, expect, it } from 'vitest'
import { validateCheckout, updateOrderStatus } from '@/lib/business'

describe('orders API contract cases', () => {
  it.each([
    [{ isLoggedIn: false, lines: [], recipientName: '', shippingAddress: '', phone: '' }, 'auth/cart'],
    [{ isLoggedIn: true, lines: [], recipientName: 'A', shippingAddress: 'B', phone: 'C' }, 'empty-cart'],
    [{ isLoggedIn: true, lines: [{ productId: 1, price: 1, quantity: 1, stock: 0 }], recipientName: 'A', shippingAddress: 'B', phone: 'C' }, 'stock'],
  ])('rejects invalid checkout (%s)', (input) => expect(validateCheckout(input as any).valid).toBe(false))
  it.each([
    ['DRAFT', 'CONFIRMED'], ['DRAFT', 'CANCELLED'], ['CONFIRMED', 'COMPLETED'], ['CONFIRMED', 'CANCELLED'],
  ])('allows valid status %s -> %s', (from, to) => expect(updateOrderStatus(from as any, to as any)).toBe(to))
  it.each([
    ['COMPLETED', 'CANCELLED'], ['CANCELLED', 'DRAFT'], ['DRAFT', 'COMPLETED'],
  ])('rejects invalid status %s -> %s', (from, to) => expect(() => updateOrderStatus(from as any, to as any)).toThrow())
})
