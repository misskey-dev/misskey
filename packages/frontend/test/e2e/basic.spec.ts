/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { test } from './fixtures.js';
import {
	// const
	ADMIN_SETUP_PASSWORD, BASE_URL,
	// locator helper
	locateMkInput, locateMkSwitch, locateMkTextarea,
	// utils
	registerUser, resetState, visitHome,
	// page utils
	waitApiResponse, signIn,
} from './utils.js';
import type { RegisteredUser } from './utils.js';

test.describe('Before setup instance', () => {
	test.beforeEach(async ({ request }) => {
		await resetState();
	});

	test('successfully loads', async ({ page }) => {
		await visitHome(page);
	});

	test('setup instance', async ({ page }) => {
		await visitHome(page);

		await locateMkInput(page, 'admin-initial-password').fill(ADMIN_SETUP_PASSWORD);
		await locateMkInput(page, 'admin-username').fill('admin');
		await locateMkInput(page, 'admin-password').fill('admin1234');

		const signupResponse = waitApiResponse(page, '/api/admin/accounts/create');
		await page.getByTestId('admin-ok').click();
		await signupResponse;

		await page.getByTestId('next').click();
		await locateMkInput(page, 'server-setup-server-name').fill('Testskey');
		const updateMetaResponse = waitApiResponse(page, '/api/admin/update-meta');
		await page.getByTestId('server-setup-wizard-apply').click();
		await updateMetaResponse;
	});
});

test.describe('After setup instance', () => {
	test.beforeEach(async () => {
		await resetState();
		await registerUser('admin', 'pass', true);
	});

	test('successfully loads', async ({ page }) => {
		await visitHome(page);
	});

	test('signup', async ({ page }) => {
		await visitHome(page);

		await page.getByTestId('signup').click();
		await page.getByTestId('signup-rules-continue').waitFor({ state: 'visible' });
		test.expect(await page.getByTestId('signup-rules-continue').isDisabled()).toBeTruthy();

		await locateMkSwitch(page, 'signup-rules-notes-agree').click();
		await page.getByTestId('modal-dialog-ok').click();
		await page.getByTestId('signup-rules-continue').click();

		test.expect(await page.getByTestId('signup-submit').isDisabled()).toBeTruthy();
		await locateMkInput(page, 'signup-username').fill('alice');
		test.expect(await page.getByTestId('signup-submit').isDisabled()).toBeTruthy();
		await locateMkInput(page, 'signup-password').fill('alice1234');
		test.expect(await page.getByTestId('signup-submit').isDisabled()).toBeTruthy();
		await locateMkInput(page, 'signup-password-retype').fill('alice1234');
		test.expect(await page.getByTestId('signup-submit').isDisabled()).toBeTruthy();
		await locateMkInput(page, 'signup-invitation-code').fill('test-invitation-code');
		test.expect(await page.getByTestId('signup-submit').isDisabled()).toBeFalsy();

		const signupResponse = waitApiResponse(page, '/api/signup');
		await page.getByTestId('signup-submit').click();
		await signupResponse;
	});

	test('signup with duplicated username', async ({ page }) => {
		await registerUser('alice', 'alice1234');
		await visitHome(page);

		await page.getByTestId('signup').click();
		await locateMkSwitch(page, 'signup-rules-notes-agree').click();
		await page.getByTestId('modal-dialog-ok').click();
		test.expect(await page.getByTestId('signup-rules-continue').isDisabled()).toBeFalsy();
		await page.getByTestId('signup-rules-continue').click();

		await locateMkInput(page, 'signup-username').fill('alice');
		await locateMkInput(page, 'signup-password').fill('alice1234');
		await locateMkInput(page, 'signup-password-retype').fill('alice1234');
		test.expect(await page.getByTestId('signup-submit').isDisabled()).toBeTruthy();
	});
});

test.describe('After user signup', () => {
	let admin: RegisteredUser;
	let alice: RegisteredUser;

	test.beforeEach(async () => {
		await resetState();
		admin = await registerUser('admin', 'pass', true);
		alice = await registerUser('alice', 'alice1234');
	});

	test('successfully loads', async ({ page }) => {
		await visitHome(page);
	});

	test('signin', async ({ page }) => {
		await visitHome(page);

		await page.getByTestId('signin').click();

		await page.getByTestId('signin-page-input').waitFor({ state: 'visible', timeout: 10000 });
		await locateMkInput(page, 'signin-username').fill('alice');
		// Enterキーで続行できるかどうかの確認も兼ねる
		await page.keyboard.press('Enter');

		await page.getByTestId('signin-page-password').waitFor({ state: 'visible', timeout: 10000 });
		await locateMkInput(page, 'signin-password').fill('alice1234');

		const signinResponse = waitApiResponse(page, '/api/signin-flow');
		// Enterキーで続行できるかどうかの確認も兼ねる
		await page.keyboard.press('Enter');
		await signinResponse;
	});

	test('suspend', async ({ page }) => {
		await page.request.post(`${BASE_URL}/api/admin/suspend-user`, {
			data: {
				i: admin.token,
				userId: alice.id,
			},
		});

		await visitHome(page);

		await page.getByTestId('signin').click();

		await page.getByTestId('signin-page-input').waitFor({ state: 'visible', timeout: 10000 });
		await locateMkInput(page, 'signin-username').fill('alice');
		await page.keyboard.press('Enter');

		await page.getByText('This account has been suspended due to').waitFor({ timeout: 10000 });
	});
});

test.describe('After user signed in', () => {
	test.beforeEach(async ({ page }) => {
		await resetState();
		await registerUser('admin', 'pass', true);
		await registerUser('alice', 'alice1234');
		await signIn(page, 'alice', 'alice1234');
	});

	test('successfully loads', async ({ page }) => {
		// 表示に時間がかかるのでデフォルト秒数だとタイムアウトする
		await page.getByTestId('user-setup-continue').waitFor({ state: 'visible', timeout: 30000 });
	});

	test('account setup wizard', async ({ page }) => {
		// 表示に時間がかかるのでデフォルト秒数だとタイムアウトする
		await page.getByTestId('user-setup-continue').click({ timeout: 30000 });

		await locateMkInput(page, 'user-setup-user-name').fill('ありす');
		await locateMkTextarea(page, 'user-setup-user-description').fill('ほげ');
		// TODO: アイコン設定のテスト
		await page.getByTestId('user-setup-continue').click();

		// プライバシー設定
		await page.getByTestId('user-setup-continue').click();

		// フォロー設定
		await page.getByTestId('user-setup-continue').click();

		// プッシュ通知設定
		await page.getByTestId('user-setup-continue').click();

		// 完了
		await page.getByTestId('user-setup-continue').click();
	});
});

test.describe('After user setup', () => {
	test.beforeEach(async ({ page }) => {
		await resetState();
		await registerUser('admin', 'pass', true);
		await registerUser('alice', 'alice1234');
		await signIn(page, 'alice', 'alice1234');

		// 表示に時間がかかるのでデフォルト秒数だとタイムアウトする
		await page.locator('[data-testid="user-setup-dialog"] [data-testid="modal-window-close"]').click({ timeout: 30000 });
		await page.getByTestId('modal-dialog-ok').click();
	});

	test('note', async ({ page }) => {
		await page.getByTestId('open-post-form').waitFor({ state: 'visible' });
		await page.getByTestId('open-post-form').click();
		await page.getByTestId('post-form-text').fill('Hello, Misskey!');
		await page.getByTestId('post-form-submit').click();

		await page.getByText('Hello, Misskey!').waitFor({ timeout: 15000 });
	});

	test('open note form with hotkey', async ({ page }) => {
		await page.getByTestId('open-post-form').waitFor({ state: 'visible' });
		await page.keyboard.press('KeyN');
		await page.getByTestId('post-form-text').waitFor({ state: 'visible' });
		await page.keyboard.press('Escape');
		await page.getByTestId('post-form-text').waitFor({ state: 'hidden' });
	});
});

// TODO: 投稿フォームの公開範囲指定のテスト
// TODO: 投稿フォームのファイル添付のテスト
// TODO: 投稿フォームのハッシュタグ保持フィールドのテスト
