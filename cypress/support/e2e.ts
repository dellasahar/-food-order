import './commands'

Cypress.Commands.add('login', (email = 'user@foodorder.com', password = 'password123') => {
  cy.visit('/login')
  cy.get('[data-testid="login-email"]').type(email)
  cy.get('[data-testid="login-password"]').type(password)
  cy.contains('button', 'Login').click()
})
