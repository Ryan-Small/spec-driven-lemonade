Feature: Running the stand for a day
  The player ends the planning stage by opening the stand with a recipe and a
  price. The system then runs the day, reports the results, and moves the game
  to the planning stage of the next day.

  A recipe is the whole number of lemons, sugar and ice in one cup, written
  lemons/sugar/ice. Lemonade is made to order: only sold cups consume supplies.

  Constants: price 1 to 200 cents per cup. Recipe amounts 1 to 4.
  Base customers by weather: RAINY 20, CLOUDY 40, SUNNY 60, HOT 80.
  Recipe bonus: +10% if lemons >= 2, +10% if sugar >= 2,
  +10% if ice >= 2 and the weather is HOT. The bonuses add up.
  Demand noise: a whole percentage from -10 to +10.

  Demand formula, with one rounding down at the end:
    demand = base x (100 + noise)/100 x (100 + bonus)/100 x (200 - price)/199

  Rule: REQ-007 If the player opens the stand with a recipe amount below 1 or above 4, then the system shall reject the action and change nothing.

    @REQ-007 @api
    Scenario Outline: A recipe amount out of range is rejected
      Given a new game
      When the player opens the stand with recipe <recipe> at price 100
      Then the request is rejected with error "INVALID_RECIPE"
      And the game is on day 1 of 7

      Examples:
        | recipe |
        | 0/1/1  |
        | 1/5/1  |
        | 1/1/0  |
        | 1/1/5  |

    @REQ-007 @api
    Scenario Outline: A recipe at the limits is accepted
      Given a new game
      When the player opens the stand with recipe <recipe> at price 100
      Then the game is on day 2 of 7

      Examples:
        | recipe |
        | 1/1/1  |
        | 4/4/4  |

  Rule: REQ-008 If the player opens the stand with a price below 1 cent or above 200 cents, then the system shall reject the action and change nothing.

    @REQ-008 @api
    Scenario Outline: A price out of range is rejected
      Given a new game
      When the player opens the stand with recipe 1/1/1 at price <price>
      Then the request is rejected with error "PRICE_OUT_OF_RANGE"
      And the game is on day 1 of 7

      Examples:
        | price |
        | 0     |
        | 201   |

    @REQ-008 @api
    Scenario Outline: A price at the limits is accepted
      Given a new game
      When the player opens the stand with recipe 1/1/1 at price <price>
      Then the game is on day 2 of 7

      Examples:
        | price |
        | 1     |
        | 200   |

    @REQ-008 @ui
    Scenario: The browser shows an error for a price above the maximum
      Given a game on day 1 with cash 2000 cents
      When the player opens the stand with recipe 1/1/1 at price "$2.01"
      Then the page shows the error "Price must be between $0.01 and $2.00"
      And the page shows "Day 1 of 7"

  Rule: REQ-009 When the player opens the stand, the system shall compute the customer demand from the weather, the price, the recipe and the demand noise with the demand formula.

    @REQ-009 @api
    Scenario Outline: Demand follows the weather, the price, the recipe and the noise
      Given a new game where the weather on day 1 is "<weather>" and the demand noise is <noise> percent
      When the player opens the stand with recipe <recipe> at price <price>
      Then the day results show <customers> customers

      Examples:
        | weather | noise | recipe | price | customers |
        | SUNNY   | 0     | 1/1/1  | 100   | 30        |
        | SUNNY   | 0     | 1/1/1  | 1     | 60        |
        | SUNNY   | 0     | 1/1/1  | 200   | 0         |
        | RAINY   | 0     | 1/1/1  | 100   | 10        |
        | CLOUDY  | 0     | 1/1/1  | 100   | 20        |
        | HOT     | 0     | 1/1/1  | 100   | 40        |
        | SUNNY   | 10    | 1/1/1  | 100   | 33        |
        | SUNNY   | -10   | 1/1/1  | 100   | 27        |
        | SUNNY   | 0     | 2/1/1  | 100   | 33        |
        | SUNNY   | 0     | 1/2/1  | 100   | 33        |
        | SUNNY   | 0     | 2/2/1  | 100   | 36        |
        | SUNNY   | 0     | 1/1/2  | 100   | 30        |
        | HOT     | 0     | 1/1/2  | 100   | 44        |
        | HOT     | 0     | 2/2/2  | 50    | 78        |

  Rule: REQ-010 When the day runs, the system shall sell a number of cups equal to the smaller of the demand and the number of cups the inventory can make with the recipe, shall add the revenue to the cash, and shall remove the supplies of the sold cups from the inventory.

    @REQ-010 @api
    Scenario: The stand sells the full demand when the inventory is sufficient
      Given a new game where the weather on day 1 is "SUNNY" and the demand noise is 0 percent
      And the player buys:
        | lemons | sugar | cups | ice |
        | 40     | 40    | 40   | 40  |
      When the player opens the stand with recipe 1/1/1 at price 100
      Then the day results show 30 customers
      And the day results show 30 cups sold
      And the day results show revenue of 3000 cents
      And the cash is 3360 cents

    @REQ-010 @api
    Scenario: The scarcest supply limits the cups sold
      Given a new game where the weather on day 1 is "SUNNY" and the demand noise is 0 percent
      And the player buys:
        | lemons | sugar | cups | ice |
        | 30     | 20    | 20   | 40  |
      When the player opens the stand with recipe 2/1/3 at price 100
      Then the day results show 33 customers
      And the day results show 13 cups sold
      And the day results show revenue of 1300 cents
      And the inventory is:
        | lemons | sugar | cups | ice |
        | 4      | 7     | 7    | 0   |

    @REQ-010 @api
    Scenario: The stand sells nothing when the inventory is empty
      Given a new game where the weather on day 1 is "SUNNY" and the demand noise is 0 percent
      When the player opens the stand with recipe 1/1/1 at price 100
      Then the day results show 30 customers
      And the day results show 0 cups sold
      And the cash is 2000 cents

  Rule: REQ-011 When a day ends, the system shall discard all remaining ice and shall carry the remaining lemons, sugar and cups over to the next day.

    @REQ-011 @api
    Scenario: Unused ice melts and the other supplies carry over
      Given a new game where the weather on day 1 is "SUNNY" and the demand noise is 0 percent
      And the player buys:
        | lemons | sugar | cups | ice |
        | 40     | 40    | 40   | 40  |
      When the player opens the stand with recipe 1/1/1 at price 100
      Then the day results show 10 ice melted
      And the game is on day 2 of 7
      And the inventory is:
        | lemons | sugar | cups | ice |
        | 10     | 10    | 10   | 0   |

  Rule: REQ-012 When a day ends, the system shall report the day number, the actual weather, the customers, the cups sold, the revenue, the amount spent on supplies that day, the profit (revenue minus supply spend), the ice melted, the ending inventory and the ending cash.

    @REQ-012 @api
    Scenario: The day results report every figure
      Given a new game where the weather on day 1 is "SUNNY" and the demand noise is 0 percent
      And the player buys:
        | lemons | sugar | cups | ice |
        | 10     | 10    | 20   | 30  |
      When the player opens the stand with recipe 1/1/2 at price 100
      Then the day results are:
        | day | weather | customers | cups sold | revenue | supply spend | profit | ice melted | ending cash |
        | 1   | SUNNY   | 30        | 10        | 1000    | 480          | 520    | 10         | 2520        |
      And the day results show an ending inventory of:
        | lemons | sugar | cups | ice |
        | 0      | 0     | 10   | 0   |

    @REQ-012 @api
    Scenario: A day with no sales and a purchase reports a loss
      Given a new game where the weather on day 1 is "SUNNY" and the demand noise is 0 percent
      And the player buys:
        | lemons | sugar | cups | ice |
        | 4      | 0     | 0    | 0   |
      When the player opens the stand with recipe 1/1/1 at price 100
      Then the day results show 0 cups sold
      And the day results show profit of -100 cents

    @REQ-012 @ui
    Scenario: The browser shows the results of the day
      Given a game on day 1 with cash 1520 cents
      And the day will end with these results:
        | day | weather | customers | cups sold | revenue | supply spend | profit | ice melted | ending cash |
        | 1   | SUNNY   | 30        | 10        | 1000    | 480          | 520    | 10         | 2520        |
      When the player opens the stand with recipe 1/1/2 at price "$1.00"
      Then the page shows the results of day 1:
        | weather | customers | cups sold | revenue | profit | ice melted |
        | Sunny   | 30        | 10        | $10.00  | $5.20  | 10         |
      And the page shows cash of "$25.20"
