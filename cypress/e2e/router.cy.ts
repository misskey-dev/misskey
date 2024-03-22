/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

describe('Router transition', () => {
	describe('Redirect', () => {
		// サーバの初期化。ルートのテストに関しては各describeごとに1度だけ実行で十分だと思う（使いまわした方が早い）
		before(() => {
			cy.resetState();

			// インスタンス初期セットアップ
			cy.registerUser('admin', 'pass', true);

			// ユーザー作成
			cy.registerUser('alice', 'alice1234');

			cy.login('alice', 'alice1234');

			// アカウント初期設定ウィザード
			// 表示に時間がかかるのでデフォルト秒数だとタイムアウトする
			cy.get('[data-cy-user-setup] [data-cy-modal-window-close]', { timeout: 30000 }).click();
			cy.wait(500);
			cy.get('[data-cy-modal-dialog-ok]').click();
		});

		it('redirect to user profile', () => {
			// テストのためだけに用意されたリダイレクト用ルートに飛ぶ
			cy.visit('/redirect-test');

			// プロフィールページのURLであることを確認する
			cy.url().should('include', '/@alice')
		});
	});
});
