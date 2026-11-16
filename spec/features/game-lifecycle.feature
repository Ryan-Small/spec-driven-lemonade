Feature: Game lifecycle
  A game runs for 7 days. Each day has a planning stage. The player ends the
  planning stage by opening the stand. Money is in whole cents.

  Constants: game length 7 days, starting cash 2000 cents.
  Supply prices per unit: lemon 25, sugar 10, cup 5, ice 1 (cents).

  Rule: REQ-001 When the player starts a new game, the system shall create a game on day 1 of 7 with 2000 cents of cash, an empty inventory, and a reported seed.

    @REQ-001 @api
    Scenario: A new game starts on day 1 with the starting cash
      When the player starts a new game
      Then the game status is "IN_PROGRESS"
      And the game is on day 1 of 7
      And the cash is 2000 cents
      And the inventory is:
        | lemons | sugar | cups | ice |
        | 0      | 0     | 0    | 0   |

    @REQ-001 @api
    Scenario: A game started without a seed reports the seed the system chose
      When the player starts a new game
      Then the game reports a seed

    @REQ-001 @ui
    Scenario: The player starts a new game in the browser
      Given the player is on the start page
      When the player starts a new game
      Then the page shows "Day 1 of 7"
      And the page shows cash of "$20.00"

  Rule: REQ-002 Where a seed is supplied at game start, the system shall produce the same weather and the same day results for the same sequence of player actions.

    @REQ-002 @api
    Scenario: Two games with the same seed and the same actions have the same results
      Given game "A" is started with seed 42
      And game "B" is started with seed 42
      When the player takes these actions in both games on each of 7 days:
        | buy lemons | buy sugar | buy cups | buy ice | recipe lemons | recipe sugar | recipe ice | price |
        | 2          | 2         | 2        | 2       | 1             | 1            | 1          | 100   |
      Then the day results of game "A" and game "B" are identical for every day

    @REQ-002 @api
    Scenario: A game reports the seed that was supplied
      When the player starts a new game with seed 42
      Then the game reports seed 42

  Rule: REQ-013 When day 7 ends, the system shall end the game with status COMPLETED and shall report the final cash and the profit against the starting cash.

    @REQ-013 @api
    Scenario: The game completes after day 7
      Given a new game
      When the player opens the stand on each of 7 days with recipe 1/1/1 at price 100
      Then the game status is "COMPLETED"
      And the final cash is 2000 cents
      And the final profit is 0 cents

    @REQ-013 @api
    Scenario: The game is still in progress after day 6
      Given a new game
      When the player opens the stand on each of 6 days with recipe 1/1/1 at price 100
      Then the game status is "IN_PROGRESS"
      And the game is on day 7 of 7

    @REQ-013 @ui
    Scenario: The game-over page shows the final cash and profit
      Given a completed game with final cash 2090 cents
      When the player views the game
      Then the page shows "Game over"
      And the page shows final cash of "$20.90"
      And the page shows profit of "$0.90"

    @REQ-013 @e2e
    Scenario: The player plays a full game in the browser
      Given the player starts a new game in the browser
      When the player buys 10 lemons, 10 sugar, 10 cups and 10 ice
      And the player opens the stand on each of 7 days with recipe 1/1/1 at price "$0.50"
      Then the page shows "Game over"
      And the page shows final cash of "$20.90"
      And the page shows profit of "$0.90"

  Rule: REQ-014 If, at the start of a planning stage, the cash is less than the cost of the supplies the player lacks for one cup of the minimum recipe (1 lemon, 1 sugar, 1 ice, 1 cup), then the system shall end the game with status BANKRUPT.

    @REQ-014 @api
    Scenario: The game ends when the player cannot afford one cup
      Given a new game
      And the player buys:
        | lemons | sugar | cups | ice |
        | 80     | 0     | 0    | 0   |
      When the player opens the stand with recipe 1/1/1 at price 100
      Then the game status is "BANKRUPT"
      And the final cash is 0 cents

    @REQ-014 @api
    Scenario: The game continues when the cash equals the cost of the missing supplies
      Given a new game
      And the player buys:
        | lemons | sugar | cups | ice |
        | 79     | 0     | 0    | 9   |
      When the player opens the stand with recipe 1/1/1 at price 100
      Then the cash is 16 cents
      And the game status is "IN_PROGRESS"
      And the game is on day 2 of 7

    @REQ-014 @api
    Scenario: The game ends when the cash is 1 cent short of the missing supplies
      Given a new game
      And the player buys:
        | lemons | sugar | cups | ice |
        | 79     | 0     | 0    | 10  |
      When the player opens the stand with recipe 1/1/1 at price 100
      Then the cash is 15 cents
      And the game status is "BANKRUPT"

  Rule: REQ-015 If the player acts on an unknown game or on a game that has ended, then the system shall reject the action and change nothing.

    @REQ-015 @api
    Scenario: An action on an unknown game is rejected
      When the player requests the game with an unknown ID
      Then the request is rejected with error "GAME_NOT_FOUND"

    @REQ-015 @api
    Scenario: A purchase in a game that has ended is rejected
      Given a completed game
      When the player buys:
        | lemons | sugar | cups | ice |
        | 1      | 0     | 0    | 0   |
      Then the request is rejected with error "GAME_OVER"
      And the cash is 2000 cents

    @REQ-015 @api
    Scenario: Opening the stand in a game that has ended is rejected
      Given a completed game
      When the player opens the stand with recipe 1/1/1 at price 100
      Then the request is rejected with error "GAME_OVER"
