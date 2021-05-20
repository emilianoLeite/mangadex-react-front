/// <reference types="cypress" />

describe("Logging In - HTML Web Form", function () {
  // we can use these values to log in
  const username = "jane.lae";
  const password = "password123";

  context("HTML form submission", function () {
    beforeEach(() => cy.visit("/"));
    it("displays errors on login", function () {
      // incorrect username on purpose
      cy.get("input[name=username]").type("jane.lae");
      cy.get("input[name=password]").type("password123");
      cy.get('button[name="log in"]').click();

      // we should have visible errors now
      cy.get("span")
        .should("be.visible")
        .and("contain", "Request failed with status code 401");
    });

    it("shows HomePage on success", function () {
      cy.get("input[name=username]").type(username);
      cy.get("input[name=password]").type(password);
      cy.get('button[name="log in"]').click();

      cy.get("h1").should("contain", "Welcome!");
    });
  });

  // context('Reusable "login" custom command', function () {
  //   beforeEach(function () {
  //     // login before each test
  //     cy.login(username, password);
  //   });

  //   it("can visit /dashboard", function () {
  //     // after cy.request, the session cookie has been set
  //     // and we can visit a protected page
  //     cy.visit("/");
  //     cy.get("h1").should("contain", "Welcome");
  //   });
  // });
});
