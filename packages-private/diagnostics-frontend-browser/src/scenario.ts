/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { closeUserSetupDialog, postNote, registerUser, resetState, signupThroughUi, visitHome } from '../../../packages/frontend/test/e2e/shared';
import { sleep } from './server';
import type { HeadlessChromeController } from './browser/controller';

export const scenarioDescription = 'fresh browser signup, first timeline note, after the note becomes visible';

/**
 * 各ラウンドを同じ初期状態から始めるため、DBを消して管理者だけ作り直す。
 */
export async function prepareInstance(baseUrl: string) {
	await resetState(baseUrl);
	await registerUser(baseUrl, 'admin', 'admin1234', true);
}

export async function runSignupAndPostScenario(chrome: HeadlessChromeController, baseUrl: string) {
	const page = chrome.page;
	const noteText = `Frontend browser metrics ${Date.now()}`;

	await visitHome(page, baseUrl);
	await signupThroughUi(page, { username: 'alice', password: 'password' });
	await closeUserSetupDialog(page);
	await postNote(page, noteText, 10_000);

	// 投稿直後の非同期処理が落ち着いてから計測したいので少し待つ
	await sleep(1000);
}
