describe('Basic', () => {
	before(() => {
		cy.request('POST', '/api/reset-db');
	});

	beforeEach(() => {
		cy.reload(true);
	});

  it('successfully loads', () => {
    cy.visit('/');
  });

	it('setup instance', () => {
    cy.visit('/');

		cy.get('[data-cy-admin-username] input').type('admin');

		cy.get('[data-cy-admin-password] input').type('admin1234');

		cy.get('[data-cy-admin-ok]').click();
  });

	it('signup', () => {
    cy.visit('/');

		cy.get('[data-cy-signup]').click();

		cy.get('[data-cy-signup-username] input').type('alice');

		cy.get('[data-cy-signup-password] input').type('alice1234');
	
		cy.get('[data-cy-signup-password-retype] input').type('alice1234');

		cy.get('[data-cy-signup-submit]').click();
  });

	it('signin', () => {
    cy.visit('/');

		cy.get('[data-cy-signin]').click();

		cy.get('[data-cy-signin-username] input').type('alice');

		// Enterキーでサインインできるかの確認も兼ねる
		cy.get('[data-cy-signin-password] input').type('alice1234{enter}');
  });

	it('note', () => {
    cy.visit('/');

		//#region TODO: この辺はUI操作ではなくAPI操作でログインする
		cy.get('[data-cy-signin]').click();

		cy.get('[data-cy-signin-username] input').type('alice');

		// Enterキーでサインインできるかの確認も兼ねる
		cy.get('[data-cy-signin-password] input').type('alice1234{enter}');
		//#endregion

		cy.get('[data-cy-open-post-form]').click();

		cy.get('[data-cy-post-form-text]').type('Hello, Misskey!');

		cy.get('[data-cy-open-post-form-submit]').click();

		// TODO: 投稿した文字列が画面内にあるか(=タイムラインに流れてきたか)のテスト
  });
});
