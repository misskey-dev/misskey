describe('Basic', () => {
	beforeEach(() => {
		cy.request('POST', '/api/reset-db').as('reset');
		cy.get('@reset').its('status').should('equal', 204);
		cy.clearLocalStorage();
		cy.clearCookies();
		cy.reload(true);
	});

	afterEach(() => {
		// テスト終了直前にページ遷移するようなテストケース(例えばアカウント作成)だと、たぶんCypressのバグでブラウザの内容が次のテストケースに引き継がれてしまう(例えばアカウントが作成し終わった段階からテストが始まる)。
		// waitを入れることでそれを防止できる
		cy.wait(1000);
	});

  it('successfully loads', () => {
    cy.visit('/');
  });

	it('setup instance', () => {
    cy.visit('/');

		cy.intercept('POST', '/api/admin/accounts/create').as('signup');
	
		cy.get('[data-cy-admin-username] input').type('admin');
		cy.get('[data-cy-admin-password] input').type('admin1234');
		cy.get('[data-cy-admin-ok]').click();

		// なぜか動かない
		//cy.wait('@signup').should('have.property', 'response.statusCode');
		cy.wait('@signup');
  });

	it('signup', () => {
		// インスタンス初期セットアップ
		cy.request('POST', '/api/admin/accounts/create', {
			username: 'admin',
			password: 'pass',
		}).as('setup');

		cy.get('@setup').then(() => {
			cy.visit('/');

			cy.intercept('POST', '/api/signup').as('signup');

			cy.get('[data-cy-signup]').click();
			cy.get('[data-cy-signup-username] input').type('alice');
			cy.get('[data-cy-signup-password] input').type('alice1234');
			cy.get('[data-cy-signup-password-retype] input').type('alice1234');
			cy.get('[data-cy-signup-submit]').click();

			cy.wait('@signup');
		});
  });

	it('signin', () => {
		// インスタンス初期セットアップ
		cy.request('POST', '/api/admin/accounts/create', {
			username: 'admin',
			password: 'pass',
		}).as('setup');

		cy.get('@setup').then(() => {
			// ユーザー作成
			cy.request('POST', '/api/signup', {
				username: 'alice',
				password: 'alice1234',
			}).as('signup');
		});

		cy.get('@signup').then(() => {
			cy.visit('/');

			cy.intercept('POST', '/api/signin').as('signin');

			cy.get('[data-cy-signin]').click();
			cy.get('[data-cy-signin-username] input').type('alice');
			// Enterキーでサインインできるかの確認も兼ねる
			cy.get('[data-cy-signin-password] input').type('alice1234{enter}');

			cy.wait('@signin');
		});
  });

	it('note', () => {
    cy.visit('/');

		// インスタンス初期セットアップ
		cy.request('POST', '/api/admin/accounts/create', {
			username: 'admin',
			password: 'pass',
		}).as('setup');

		cy.get('@setup').then(() => {
			// ユーザー作成
			cy.request('POST', '/api/signup', {
				username: 'alice',
				password: 'alice1234',
			}).as('signup');
		});

		cy.get('@signup').then(() => {
			cy.visit('/');

			cy.intercept('POST', '/api/signin').as('signin');

			cy.get('[data-cy-signin]').click();
			cy.get('[data-cy-signin-username] input').type('alice');
			cy.get('[data-cy-signin-password] input').type('alice1234{enter}');

			cy.wait('@signin').as('signinEnd');
		});

		cy.get('@signinEnd').then(() => {
			cy.get('[data-cy-open-post-form]').click();
			cy.get('[data-cy-post-form-text]').type('Hello, Misskey!');
			cy.get('[data-cy-open-post-form-submit]').click();

			cy.contains('Hello, Misskey!');
		});
  });

	it('suspend', function() {
		cy.request('POST', '/api/admin/accounts/create', {
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
