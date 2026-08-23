Feature: Order status management
  As an operations user
  I want order statuses to follow valid transitions
  So that order history remains consistent

  Scenario Outline: Apply valid order status transition
    Given an order currently has status "<current>"
    When I change the order status to "<next>"
    Then the order status should become "<next>"

    Examples:
      | current   | next      |
      | DRAFT     | CONFIRMED |
      | DRAFT     | CANCELLED |
      | CONFIRMED | COMPLETED |
      | CONFIRMED | CANCELLED |

  Scenario: Reject invalid completed order transition
    Given an order currently has status "COMPLETED"
    When I change the order status to "CANCELLED"
    Then the status transition should be rejected
