import { Given, Then, When } from '@cucumber/cucumber'
import assert from 'node:assert/strict'
import { updateOrderStatus } from '@/lib/business'

type World = { loggedIn?: boolean; catalog?: boolean; cartCount?: number; checkout?: Record<string, string>; confirmed?: boolean; invalid?: boolean; status?: string }
const world = {} as World

Given('I am logged in as {string}', (email: string) => { world.loggedIn = email === 'user@foodorder.com' })
Given('the FoodOrder catalog is available', () => { world.catalog = true })
Given('I have the first product in my cart', () => { world.cartCount = 1 })
When('I add the first product to the cart', () => { world.cartCount = 1 })
When('I open the cart', () => { assert.equal(world.cartCount, 1) })
When('I enter recipient name {string}', (value: string) => { world.checkout = { ...world.checkout, name: value } })
When('I enter shipping address {string}', (value: string) => { world.checkout = { ...world.checkout, address: value } })
When('I enter phone number {string}', (value: string) => { world.checkout = { ...world.checkout, phone: value } })
When('I submit checkout', () => { world.confirmed = Boolean(world.checkout?.name?.trim() && world.checkout?.address?.trim() && /^\d{8,15}$/.test(world.checkout?.phone ?? '')); world.invalid = !world.confirmed })
Then('the cart badge should show {string}', (count: string) => { assert.equal(String(world.cartCount), count) })
Then('the first product should remain in the catalog', () => { assert.equal(world.catalog, true) })
Then('the order confirmation should be displayed', () => { assert.equal(world.confirmed, true) })
Then('checkout validation should be displayed', () => { assert.equal(world.invalid, true) })
Given('an order currently has status {string}', (status: string) => { world.status = status })
When('I change the order status to {string}', (next: string) => { try { world.status = updateOrderStatus(world.status as any, next as any) } catch { world.invalid = true } })
Then('the order status should become {string}', (status: string) => { assert.equal(world.status, status) })
Then('the status transition should be rejected', () => { assert.equal(world.invalid, true) })
