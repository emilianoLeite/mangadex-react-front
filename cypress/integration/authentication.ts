/// <reference types="cypress" />
describe("Authentication", function () {
  context("HTML form submission", function () {
    beforeEach(() => cy.visit("/"));

    it("handles errors and success", function () {
      const unauthorizedStatusCode = 401;
      cy.intercept(
        {
          method: "POST",
          url: "https://api.mangadex.org/auth/login",
          times: 1,
        },
        {
          statusCode: unauthorizedStatusCode,
          fixture: "failed_login.json",
        }
      );

      cy.get("input[name=username]").type("jane.lane");
      cy.get("input[name=password]").type("wrong_password");
      cy.get('button[name="log in"]').click();

      cy.get("span")
        .should("be.visible")
        .and(
          "contain",
          `Request failed with status code ${unauthorizedStatusCode}`
        );

      cy.intercept(
        {
          method: "POST",
          url: "https://api.mangadex.org/auth/login",
          times: 1,
        },
        {
          statusCode: 200,
          fixture: "successful_login.json",
        }
      );
      cy.get("input[name=password]").clear().type("right_password");
      cy.get('button[name="log in"]').click();

      cy.get("h1").should("contain", "Welcome!");

      // verify that tokens were persisted:
      cy.reload();

      cy.get("h1").should("contain", "Welcome!");
    });
  });

  context("when user is already logged in", () => {
    beforeEach(() => {
      cy.login();
    });

    it("displays the Home Page at the root", () => {
      cy.visit("/");

      cy.get("h1").should("contain", "Welcome!");
    });
  });
});
