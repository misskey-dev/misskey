describe('Basic', () => {
	beforeEach(() => {
		cy.request('POST', '/api/reset-db').as('reset');
		cy.get('@reset').its('status').should('equal', 204)
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
		// インスタンス初期セットアップ
		cy.request('POST', '/api/signup', {
			username: 'admin',
			password: 'pass',
		}).as('setup');

		cy.get('@setup').then(() => {
			cy.visit('/');

			cy.get('[data-cy-signup]').click();
			cy.get('[data-cy-signup-username] input').type('alice');
			cy.get('[data-cy-signup-password] input').type('alice1234');
			cy.get('[data-cy-signup-password-retype] input').type('alice1234');
			cy.get('[data-cy-signup-submit]').click();
		});
  });

	it('signin', () => {
		// インスタンス初期セットアップ
		cy.request('POST', '/api/signup', {
			username: 'admin',
			password: 'pass',
		});

		// ユーザー作成
		cy.request('POST', '/api/signup', {
			username: 'alice',
			password: 'alice1234',
		});

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

	it('suspend', function() {
		cy.request('POST', '/api/signup', {
			username: 'admin',
			password: 'pass',
		}).its('body').as('admin');

		cy.request('POST', '/api/signup', {
			username: 'alice',
			password: 'pass',
		}).its('body').as('alice');

		cy.then(() => {
			cy.request('POST', '/api/admin/suspend-user', {
				i: this.admin.token,
				userId: this.alice.id,
			});
	
			cy.visit('/');
	
			cy.get('[data-cy-signin]').click();
			cy.get('[data-cy-signin-username] input').type('alice');
			cy.get('[data-cy-signin-password] input').type('alice1234{enter}');
	
			cy.contains('アカウントが凍結されています');
		});
	});
});
