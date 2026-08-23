Feature: FoodOrder ordering
  As a customer
  I want to order food from the catalog
  So that I can receive it at my address

  Background:
    Given I am logged in as "user@foodorder.com"
    And the FoodOrder catalog is available

  Scenario: Add a product to the cart
    When I add the first product to the cart
    Then the cart badge should show "1"
    And the first product should remain in the catalog

  Scenario: Complete checkout with valid information
    Given I have the first product in my cart
    When I open the cart
    And I enter recipient name "Raka Pratama"
    And I enter shipping address "Jl. Merdeka No. 10"
    And I enter phone number "081234567890"
    And I submit checkout
    Then the order confirmation should be displayed

  Scenario Outline: Reject invalid checkout data
    Given I have the first product in my cart
    When I open the cart
    And I enter recipient name "<name>"
    And I enter shipping address "<address>"
    And I enter phone number "<phone>"
    And I submit checkout
    Then checkout validation should be displayed

    Examples:
      | name | address | phone |
      |      | Jl. Test 1 | 081234567890 |
      | Raka |           | 081234567890 |
      | Raka | Jl. Test 1 | 123 |
