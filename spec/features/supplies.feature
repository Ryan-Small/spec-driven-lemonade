Feature: Buying supplies
  During the planning stage the player buys lemons, sugar, cups and ice.
  The player can make any number of purchases in one planning stage.

  Supply prices per unit: lemon 25, sugar 10, cup 5, ice 1 (cents).

  Rule: REQ-004 When the player buys supplies during the planning stage, the system shall deduct the total cost from the cash and add the supplies to the inventory.

    @REQ-004 @api
    Scenario: A purchase deducts the cost and adds the supplies
      Given a new game
      When the player buys:
        | lemons | sugar | cups | ice |
        | 10     | 10    | 20   | 30  |
      Then the cash is 1520 cents
      And the inventory is:
        | lemons | sugar | cups | ice |
        | 10     | 10    | 20   | 30  |

    @REQ-004 @api
    Scenario: A second purchase adds to the first
      Given a new game
      And the player buys:
        | lemons | sugar | cups | ice |
        | 10     | 10    | 20   | 30  |
      When the player buys:
        | lemons | sugar | cups | ice |
        | 2      | 0     | 0    | 5   |
      Then the cash is 1465 cents
      And the inventory is:
        | lemons | sugar | cups | ice |
        | 12     | 10    | 20   | 35  |

    @REQ-004 @api
    Scenario: A purchase that costs exactly the cash is accepted
      Given a new game
      When the player buys:
        | lemons | sugar | cups | ice |
        | 80     | 0     | 0    | 0   |
      Then the cash is 0 cents

    @REQ-004 @ui
    Scenario: The player buys supplies in the browser
      Given a game on day 1 with cash 2000 cents
      When the player buys 10 lemons, 10 sugar, 20 cups and 30 ice
      Then the page shows cash of "$15.20"
      And the page shows an inventory of 10 lemons, 10 sugar, 20 cups and 30 ice

  Rule: REQ-005 If a purchase costs more than the cash, then the system shall reject the whole purchase and change nothing.

    @REQ-005 @api
    Scenario: A purchase 1 cent over the cash is rejected as a whole
      Given a new game
      When the player buys:
        | lemons | sugar | cups | ice |
        | 80     | 0     | 0    | 1   |
      Then the request is rejected with error "INSUFFICIENT_CASH"
      And the cash is 2000 cents
      And the inventory is:
        | lemons | sugar | cups | ice |
        | 0      | 0     | 0    | 0   |

  Rule: REQ-006 If a purchase quantity is negative or is not a whole number, then the system shall reject the whole purchase and change nothing.

    @REQ-006 @api
    Scenario Outline: A purchase with an invalid quantity is rejected
      Given a new game
      When the player buys <quantity> of "<supply>"
      Then the request is rejected with error "INVALID_QUANTITY"
      And the cash is 2000 cents

      Examples:
        | supply | quantity |
        | lemons | -1       |
        | ice    | 2.5      |
