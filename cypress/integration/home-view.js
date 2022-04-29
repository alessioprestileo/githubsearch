const PORT = 8888;
const FIXTURE_DELAY = 100;

describe('Home view loaded without any url params', () => {
  it('Home view is loaded', () => {
    cy.visit(`localhost:${PORT}`);
  });

  it('Title is displayed', () => {
    cy.getBySel('header-title').should('have.text', 'Search GitHub Users');
  });

  it('Search box is displayed', () => {
    cy.getBySel('search-box');
  });

  it('No elements related to search result are displayed', () => {
    cy.getBySelLike('search-result').should('not.exist');
  });

  describe('User can', () => {
    beforeEach(() => {
      cy.intercept(
        'GET',
        '/.netlify/functions/github-users-search?q=salvo%20in%3Aname&first=20',
        {
          delay: FIXTURE_DELAY,
          fixture: 'salvo-in-name-page-1',
        }
      );
    });
    it('Search for GitHub users', () => {
      cy.getBySel('search-box').type('salvo in:name');
      cy.getBySelLike('search-result').should('not.exist');
      cy.getBySel('search-box').submit();
      checkViewAfterNewQueryIsSubmitted();
      assertPageActive(1);
    });
  });
});

describe('Home view loaded with url params', () => {
  beforeEach(() => {
    cy.intercept(
      'GET',
      '/.netlify/functions/github-users-search?q=sal%20in%3Aname&first=20',
      {
        delay: FIXTURE_DELAY,
        fixture: 'sal-in-name-page-1',
      }
    );
    cy.intercept(
      'GET',
      '/.netlify/functions/github-users-search?q=salvo%20in%3Aname&first=20',
      {
        delay: FIXTURE_DELAY,
        fixture: 'salvo-in-name-page-1',
      }
    );
    cy.intercept(
      'GET',
      '/.netlify/functions/github-users-search?q=salvo%20in%3Aname&first=20&after=Y3Vyc29yOjIw',
      {
        delay: FIXTURE_DELAY,
        fixture: 'salvo-in-name-page-2',
      }
    );
    cy.intercept(
      'GET',
      '/.netlify/functions/github-users-search?q=salvo%20in%3Aname&last=20&before=Y3Vyc29yOjIx',
      {
        delay: FIXTURE_DELAY,
        fixture: 'salvo-in-name-page-1',
      }
    );
    cy.intercept(
      'GET',
      '/.netlify/functions/github-users-move-cursor?q=salvo%20in%3Aname&shift=60&cursor=Y3Vyc29yOjIw',
      {
        delay: FIXTURE_DELAY,
        fixture: 'salvo-in-name-move-cursor-1-5',
      }
    );
    cy.intercept(
      'GET',
      '/.netlify/functions/github-users-search?q=salvo%20in%3Aname&first=20&after=Y3Vyc29yOjgw',
      {
        delay: FIXTURE_DELAY,
        fixture: 'salvo-in-name-page-5',
      }
    );
    cy.intercept(
      'GET',
      '/.netlify/functions/github-users-move-cursor?q=salvo%20in%3Aname&shift=60&cursor=Y3Vyc29yOjIw',
      {
        delay: FIXTURE_DELAY,
        fixture: 'salvo-in-name-move-cursor-5-1',
      }
    );
    cy.intercept(
      'GET',
      '/.netlify/functions/github-users-move-cursor?q=salvo%20in%3Aname&shift=100&cursor=Y3Vyc29yOjIw',
      {
        delay: FIXTURE_DELAY,
        fixture: 'salvo-in-name-move-cursor-1-12-first',
      }
    );
    cy.intercept(
      'GET',
      '/.netlify/functions/github-users-move-cursor?q=salvo%20in%3Aname&shift=100&cursor=Y3Vyc29yOjEyMA==',
      {
        delay: FIXTURE_DELAY,
        fixture: 'salvo-in-name-move-cursor-1-12-second',
      }
    );
    cy.intercept(
      'GET',
      '/.netlify/functions/github-users-search?q=salvo%20in%3Aname&first=20&after=Y3Vyc29yOjIyMA==',
      {
        delay: FIXTURE_DELAY,
        fixture: 'salvo-in-name-page-12',
      }
    );
  });
  it('Home view is loaded', () => {
    cy.visit(`localhost:${PORT}/?q=sal%20in%3Aname`);
  });

  it('Title is displayed', () => {
    cy.getBySel('header-title').should('have.text', 'Search GitHub Users');
  });

  it('Search box is displayed', () => {
    cy.getBySel('search-box');
  });

  it('All elements related to search result are displayed', () => {
    cy.getBySel('search-result-fetching');
    cy.getBySel('search-result-total');
    cy.getBySel('search-result-pagination');
    cy.getBySel('search-result-items-list');
  });

  describe('User can', () => {
    it('Search for GitHub users', () => {
      cy.getBySel('search-box').within(() => {
        cy.get('input').clear().type('salvo in:name');
      });
      cy.getBySel('search-box').submit();
      checkViewAfterNewQueryIsSubmitted();
      assertPageActive(1);
    });

    it('Go to next page', () => {
      cy.get('[aria-label="Go to next page"]').click();
      checkViewAfterPageIsRequested();
      assertPageActive(2);
    });

    it('Go to previous page', () => {
      cy.get('[aria-label="Go to previous page"]').click();
      checkViewAfterPageIsRequested();
      assertPageActive(1);
    });

    it('Jump several pages forward', () => {
      cy.get('[aria-label="Go to page 5"]').click();
      checkViewAfterPageIsRequested();
      assertPageActive(5);
    });

    it('Jump back to page 1', () => {
      cy.get('[aria-label="Go to page 1"]').click();
      checkViewAfterPageIsRequested();
      assertPageActive(1);
    });

    it('Jump to last page', () => {
      cy.get('[aria-label="Go to page 12"]').click();
      checkViewAfterPageIsRequested();
      assertPageActive(12);
    });
  });
});

const assertPageActive = (pageNumber) => {
  cy.get(`[aria-label="page ${pageNumber}"]`)
    .should('have.attr', 'aria-current')
    .and('equal', 'true');
};

const checkViewAfterNewQueryIsSubmitted = () => {
  cy.getBySel('search-result-fetching');
  cy.getBySel('search-result-total');
  cy.getBySel('search-result-pagination');
  cy.getBySel('search-result-items-list');
};

const checkViewAfterPageIsRequested = () => {
  cy.getBySel('search-result-items-list').should('not.exist');
  cy.getBySel('search-result-items-fetching');
  cy.getBySel('search-result-total');
  cy.getBySel('search-result-pagination');
  cy.getBySel('search-result-items-list');
};
