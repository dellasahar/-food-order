import { CheckoutPage, LoginPage, ProductsPage } from '../support/pages'

describe('FoodOrder UI', () => {
  const login = new LoginPage()
  const products = new ProductsPage()
  const checkout = new CheckoutPage()

  beforeEach(() => { login.visit() })

  it('shows validation for empty login', () => { login.submit(); cy.contains('Email wajib diisi').should('be.visible') })
  it('logs in with valid credentials', () => { login.email('user@foodorder.com').password('password123').submit(); cy.url().should('include', '/products') })
  it('shows product cards', () => { login.email('user@foodorder.com').password('password123').submit(); products.firstCard().should('be.visible') })
  it('adds a product to cart', () => { login.email('user@foodorder.com').password('password123').submit(); products.addFirstProduct(); cy.get('[data-testid="cart-badge"]').should('contain', '1') })
  it('opens cart drawer', () => { login.email('user@foodorder.com').password('password123').submit(); products.addFirstProduct().openCart(); cy.contains('Keranjang').should('be.visible') })
  it('rejects empty recipient name', () => { login.email('user@foodorder.com').password('password123').submit(); products.addFirstProduct().openCart(); checkout.submit(); cy.contains('Nama penerima wajib diisi').should('be.visible') })
  it('rejects invalid phone', () => { login.email('user@foodorder.com').password('password123').submit(); products.addFirstProduct().openCart(); checkout.name('Raka').address('Jl. Test').phone('123').submit(); cy.contains('Nomor telepon tidak valid').should('be.visible') })
  it('submits valid checkout', () => { login.email('user@foodorder.com').password('password123').submit(); products.addFirstProduct().openCart(); checkout.name('Raka').address('Jl. Merdeka').phone('081234567890').submit(); cy.contains('Pesanan berhasil dibuat').should('be.visible') })
})
