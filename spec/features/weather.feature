Feature: Weather forecast
  Each day has one weather type: RAINY, CLOUDY, SUNNY or HOT.
  In release 1 the forecast always equals the actual weather.

  Rule: REQ-003 While a day is in the planning stage, the system shall show the weather forecast for that day, and the forecast shall equal the actual weather of that day.

    @REQ-003 @api
    Scenario Outline: The forecast shows the weather of the current day
      Given a new game where the weather on day 1 is "<weather>"
      When the player requests the game
      Then the forecast for the current day is "<weather>"

      Examples:
        | weather |
        | RAINY   |
        | CLOUDY  |
        | SUNNY   |
        | HOT     |

    @REQ-003 @api
    Scenario: The actual weather in the day results equals the forecast
      Given a new game where the weather on day 1 is "HOT"
      When the player opens the stand with recipe 1/1/1 at price 100
      Then the day results show weather "HOT"

    @REQ-003 @ui
    Scenario: The planning page shows the forecast
      Given a game on day 1 with forecast "SUNNY"
      When the player views the game
      Then the page shows the forecast "Sunny"
