export class LoginPage {
  visit() { cy.visit('/login') }
  email(value: string) { cy.get('[data-testid="login-email"]').clear().type(value); return this }
  password(value: string) { cy.get('[data-testid="login-password"]').clear().type(value); return this }
  submit() { cy.contains('button', 'Login').click(); return this }
}

export class ProductsPage {
  firstCard() { return cy.get('[data-testid="product-card"]').first() }
  addFirstProduct() { cy.get('[data-testid="add-to-cart"]').first().click(); return this }
  openCart() { cy.get('[data-testid="cart-button"]').click(); return this }
}

export class CheckoutPage {
  name(value: string) { cy.get('[data-testid="recipient-name"]').clear().type(value); return this }
  address(value: string) { cy.get('[data-testid="shipping-address"]').clear().type(value); return this }
  phone(value: string) { cy.get('[data-testid="phone-number"]').clear().type(value); return this }
  submit() { cy.get('[data-testid="checkout-submit"]').click(); return this }
}
