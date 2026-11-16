package com.lemonade.acceptance;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.instanceOf;

import io.cucumber.datatable.DataTable;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import io.restassured.response.Response;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;

/** Step definitions for spec/features/game-lifecycle.feature. Cucumber creates one instance per scenario. */
public class GameSteps {

    @Value("${local.server.port}")
    private int port;

    private Response response;

    @When("the player starts a new game")
    public void thePlayerStartsANewGame() {
        response = given().port(port).post("/api/games");
    }

    @Then("the game status is {string}")
    public void theGameStatusIs(String status) {
        response.then().statusCode(201).body("status", equalTo(status));
    }

    @Then("the game is on day {int} of {int}")
    public void theGameIsOnDayOf(int day, int totalDays) {
        response.then().body("day", equalTo(day)).body("totalDays", equalTo(totalDays));
    }

    @Then("the cash is {int} cents")
    public void theCashIsCents(int cents) {
        response.then().body("cashCents", equalTo(cents));
    }

    @Then("the inventory is:")
    public void theInventoryIs(DataTable table) {
        Map<String, Integer> expected = table.asMaps(String.class, Integer.class).get(0);
        response.then()
            .body("inventory.lemons", equalTo(expected.get("lemons")))
            .body("inventory.sugar", equalTo(expected.get("sugar")))
            .body("inventory.cups", equalTo(expected.get("cups")))
            .body("inventory.ice", equalTo(expected.get("ice")));
    }

    @Then("the game reports a seed")
    public void theGameReportsASeed() {
        response.then().statusCode(201).body("seed", instanceOf(Number.class));
    }
}
