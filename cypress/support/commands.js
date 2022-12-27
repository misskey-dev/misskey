// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

Cypress.Commands.add('resetState', () => {
	cy.window(win => {
		win.indexedDB.deleteDatabase('keyval-store');
	});
	cy.request('POST', '/api/reset-db', {}).as('reset');
	cy.get('@reset').its('status').should('equal', 204);
	cy.reload(true);
});

Cypress.Commands.add('registerUser', (username, password, isAdmin = false) => {
	const route = isAdmin ? '/api/admin/accounts/create' : '/api/signup';

	cy.request('POST', route, {
		username: username,
		password: password,
	}).its('body').as(username);
});

Cypress.Commands.add('login', (username, password) => {
	cy.visit('/');

	cy.intercept('POST', '/api/signin').as('signin');

	cy.get('[data-cy-signin]').click();
	cy.get('[data-cy-signin-username] input').type(username);
	cy.get('[data-cy-signin-password] input').type(`${password}{enter}`);

	cy.wait('@signin').as('signedIn');
});
