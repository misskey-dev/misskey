describe('After user signed in', () => {
	beforeEach(() => {
		cy.resetState();
		cy.viewport('macbook-16');

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

  it('widget edit toggle is visible', () => {
		cy.get('.mk-widget-edit').should('be.visible');
  });

	it('widget select should be visible in edit mode', () => {
		cy.get('.mk-widget-edit').click();
		cy.get('.mk-widget-select').should('be.visible');
  });

	it('first widget should be removed', () => {
		cy.get('.mk-widget-edit').click();
		cy.get('[data-cy-customize-container]:first-child [data-cy-customize-container-remove]._button').click();
		cy.get('[data-cy-customize-container]').should('have.length', 2);
	});

	function buildWidgetTest(widgetName) {
		it(`${widgetName} widget should get added`, () => {
			cy.get('.mk-widget-edit').click();
			cy.get('.mk-widget-select select').select(widgetName, { force: true });
			cy.get('[data-cy-bg]._modalBg[data-cy-transparent]').click({ multiple: true, force: true });
			cy.get('.mk-widget-add').click({ force: true });
			cy.get(`[data-cy-mkw-${widgetName}]`).should('exist');
		});
	}

	buildWidgetTest('memo');
	buildWidgetTest('notifications');
	buildWidgetTest('timeline');
	buildWidgetTest('calendar');
	buildWidgetTest('rss');
	buildWidgetTest('trends');
	buildWidgetTest('clock');
	buildWidgetTest('activity');
	buildWidgetTest('photos');
	buildWidgetTest('digitalClock');
	buildWidgetTest('federation');
	buildWidgetTest('postForm');
	buildWidgetTest('slideshow');
	buildWidgetTest('serverMetric');
	buildWidgetTest('onlineUsers');
	buildWidgetTest('jobQueue');
	buildWidgetTest('button');
	buildWidgetTest('aiscript');
	buildWidgetTest('aichan');
});
