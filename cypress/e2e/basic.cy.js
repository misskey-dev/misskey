describe('Before setup instance', () => {
	beforeEach(() => {
		cy.resetState();
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
});

describe('After setup instance', () => {
	beforeEach(() => {
		cy.resetState();

		// インスタンス初期セットアップ
		cy.registerUser('admin', 'pass', true);
	});

	afterEach(() => {
		// テスト終了直前にページ遷移するようなテストケース(例えばアカウント作成)だと、たぶんCypressのバグでブラウザの内容が次のテストケースに引き継がれてしまう(例えばアカウントが作成し終わった段階からテストが始まる)。
		// waitを入れることでそれを防止できる
		cy.wait(1000);
	});

  it('successfully loads', () => {
    cy.visit('/');
  });

	it('signup', () => {
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

describe('After user signup', () => {
	beforeEach(() => {
		cy.resetState();

		// インスタンス初期セットアップ
		cy.registerUser('admin', 'pass', true);

		// ユーザー作成
		cy.registerUser('alice', 'alice1234');
	});

	afterEach(() => {
		// テスト終了直前にページ遷移するようなテストケース(例えばアカウント作成)だと、たぶんCypressのバグでブラウザの内容が次のテストケースに引き継がれてしまう(例えばアカウントが作成し終わった段階からテストが始まる)。
		// waitを入れることでそれを防止できる
		cy.wait(1000);
	});

  it('successfully loads', () => {
    cy.visit('/');
  });

	it('signin', () => {
		cy.visit('/');

		cy.intercept('POST', '/api/signin').as('signin');

		cy.get('[data-cy-signin]').click();
		cy.get('[data-cy-signin-username] input').type('alice');
		// Enterキーでサインインできるかの確認も兼ねる
		cy.get('[data-cy-signin-password] input').type('alice1234{enter}');

		cy.wait('@signin');
  });

	it('suspend', function() {
		cy.request('POST', '/api/admin/suspend-user', {
			i: this.admin.token,
			userId: this.alice.id,
		});

		cy.visit('/');

		cy.get('[data-cy-signin]').click();
		cy.get('[data-cy-signin-username] input').type('alice');
		cy.get('[data-cy-signin-password] input').type('alice1234{enter}');

		// TODO: cypressにブラウザの言語指定できる機能が実装され次第英語のみテストするようにする
		cy.contains(/アカウントが凍結されています|This account has been suspended due to/gi);
	});
});

describe('After user singed in', () => {
	beforeEach(() => {
		cy.resetState();

		// インスタンス初期セットアップ
		cy.registerUser('admin', 'pass', true);

		// ユーザー作成
		cy.registerUser('alice', 'alice1234');

		cy.login('alice', 'alice1234');
	});

	afterEach(() => {
		// テスト終了直前にページ遷移するようなテストケース(例えばアカウント作成)だと、たぶんCypressのバグでブラウザの内容が次のテストケースに引き継がれてしまう(例えばアカウントが作成し終わった段階からテストが始まる)。
		// waitを入れることでそれを防止できる
		cy.wait(1000);
	});

  it('successfully loads', () => {
		cy.get('[data-cy-open-post-form]').should('be.visible');
  });

	it('note', () => {
		cy.get('[data-cy-open-post-form]').click();
		cy.get('[data-cy-post-form-text]').type('Hello, Misskey!');
		cy.get('[data-cy-open-post-form-submit]').click();

		cy.contains('Hello, Misskey!');
  });
});

// TODO: 投稿フォームの公開範囲指定のテスト
// TODO: 投稿フォームのファイル添付のテスト
// TODO: 投稿フォームのハッシュタグ保持フィールドのテスト
