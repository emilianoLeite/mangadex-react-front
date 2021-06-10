describe("Home Page", function () {
  context("when the user is logged in", function () {
    beforeEach(() => {
      cy.login();
      cy.visit("/");
    });

    it("shows the Followed manga list", function () {
      cy.intercept(
        {
          method: "GET",
          url: "https://api.mangadex.org/user/follows/manga/feed",
        },
        {
          statusCode: 200,
          fixture: "followed_mangas.json",
        }
      );

      cy.get("h1[data-cy='followed-manga-header']")
        .should("have.text", "Followed Manga")
        .and("be.visible");
      cy.get("li[data-cy='manga-list-item']")
        .should("contain", "Mocked Manga Title")
        .and("be.visible");
    });
  });
});
