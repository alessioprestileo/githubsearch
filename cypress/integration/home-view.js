// describe('Home view loaded without any url params', () => {
//   it('Home view is loaded', () => {
//     cy.visit('localhost:8888');
//   });

//   it('Title is displayed', () => {
//     cy.getBySel('header-title').should('have.text', 'Search GitHub Users');
//   });

//   it('Search box is displayed', () => {
//     cy.getBySel('search-box');
//   });

//   it('No elements related to search result are displayed', () => {
//     cy.getBySelLike('search-result').should('not.exist');
//   });

//   describe('User can', () => {
//     before(() => {
//       cy.fixture('salvo-in-name-page-1').then((json) => {
//         cy.intercept(
//           'GET',
//           '/.netlify/functions/github-users-search?q=salvo in:name&first=20',
//           json
//         );
//       });
//     });
//     it('Search for GitHub users', () => {
//       cy.getBySel('search-box').type('salvo in:name');
//       cy.getBySelLike('search-result').should('not.exist');
//       cy.getBySel('search-box').submit();
//       checkViewAfterNewQueryIsSubmitted();
//     });
//   });
// });

describe('Home view loaded with url params', () => {
  before(() => {
    cy.fixture('sal-in-name-page-1').then((json) => {
      cy.intercept(
        'GET',
        '/.netlify/functions/github-users-search?q=sal in:name&first=20',
        json
      );
    });
    cy.fixture('salvo-in-name-page-1').then((json) => {
      cy.intercept(
        'GET',
        '/.netlify/functions/github-users-search?q=salvo in:name&first=20',
        json
      );
    });
    cy.fixture('salvo-in-name-page-2').then((json) => {
      cy.intercept(
        'GET',
        '/.netlify/functions/github-users-search?q=salvo in:name&first=20&after=Y3Vyc29yOjIw',
        json
      );
    });
    cy.fixture('salvo-in-name-page-1').then((json) => {
      cy.intercept(
        'GET',
        '/.netlify/functions/github-users-search?q=salvo in:name&last=20&before=Y3Vyc29yOjIx',
        json
      );
    });
  });
  it('Home view is loaded', () => {
    cy.visit('localhost:8888/?q=sal%20in%3Aname');
  });

  it('Title is displayed', () => {
    cy.getBySel('header-title').should('have.text', 'Search GitHub Users');
  });

  it('Search box is displayed', () => {
    cy.getBySel('search-box');
  });

  it('All elements related to search result are displayed', () => {
    cy.getBySel('search-result-fetching');
    cy.getBySel('search-result-items-fetching');
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
    });

    it('Go to next page', () => {
      cy.get('[aria-label="Go to next page"]').click();
      checkViewAfterPageIsRequested();
    });

    it('Go to previous page', () => {
      cy.get('[aria-label="Go to previous page"]').click();
      checkViewAfterPageIsRequested();
    });
  });
});

const checkViewAfterNewQueryIsSubmitted = () => {
  cy.getBySel('search-result-fetching');
  cy.getBySel('search-result-items-fetching');
  cy.getBySel('search-result-total');
  cy.getBySel('search-result-pagination');
  cy.getBySel('search-result-items-list');
};

const checkViewAfterPageIsRequested = () => {
  // cy.getBySel('search-result-items-list').should('not.exist');
  // cy.getBySel('search-result-items-fetching');
  cy.getBySel('search-result-total');
  cy.getBySel('search-result-pagination');
  cy.getBySel('search-result-items-list');
};
