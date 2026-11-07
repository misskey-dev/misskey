/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { assert, describe, test } from 'vitest';
import { createRouter, loginFallbackComponent } from './fixture.js';

describe('[NIRAX] フォールバック', () => {
	test('pushの際、ページが見つからなかったらforcePushを発火する', () => {
		const router = createRouter('/');
		const forcePushes: string[] = [];

		router.addListener('forcePush', ctx => {
			forcePushes.push(ctx.fullPath);
			assert.strictEqual(ctx.onInit, false);
		});

		router.init();

		router.pushByPath('/missing');

		assert.deepStrictEqual(forcePushes, ['/missing']);
		assert.strictEqual(router.getCurrentFullPath(), '/');
		assert.strictEqual(router.current.route.path, '/');
	});

	test('replaceの際、ページが見つからなかったらforceReplaceを発火する', () => {
		const router = createRouter('/');
		const forceReplacements: string[] = [];

		router.addListener('forceReplace', ctx => {
			forceReplacements.push(ctx.fullPath);
			assert.strictEqual(ctx.onInit, false);
		});

		router.init();

		router.replaceByPath('/also-missing');

		assert.deepStrictEqual(forceReplacements, ['/also-missing']);
		assert.strictEqual(router.getCurrentFullPath(), '/');
		assert.strictEqual(router.current.route.path, '/');
	});

	test('初期ページが見つからない場合でも初回はforceReplaceを発火しない', () => {
		const router = createRouter('/missing');
		const forceReplacements: string[] = [];

		router.addListener('forceReplace', ctx => {
			forceReplacements.push(ctx.fullPath);
			assert.strictEqual(ctx.onInit, true);
		});

		router.init();

		assert.deepStrictEqual(forceReplacements, []); // 初回はforceReplaceを発火しない
		assert.strictEqual(router.getCurrentFullPath(), '/missing');
		assert.strictEqual(router.current.route.path, '/:(*)');
	});

	test('初期ページが見つからない場合でも、initで明示した場合はforceReplaceを発火する', () => {
		const router = createRouter('/missing');
		const forceReplacements: string[] = [];

		router.addListener('forceReplace', ctx => {
			forceReplacements.push(ctx.fullPath);
			assert.strictEqual(ctx.onInit, true);
		});

		router.init(true); // forceReplaceを強制的に発火させる

		assert.deepStrictEqual(forceReplacements, ['/missing']);
		assert.strictEqual(router.getCurrentFullPath(), '/missing');
		assert.strictEqual(router.current.route.path, '/:(*)');
	});

	test('loginRequiredなルートではコンポーネントを差し替えてshowLoginPopupを設定する', () => {
		const router = createRouter('/', false);

		router.init();

		router.pushByPath('/private');

		assert.strictEqual(router.current.route.path, '/private');
		assert.ok('component' in router.current.route);
		assert.strictEqual(router.current.route.component, loginFallbackComponent);
		assert.strictEqual(router.current.props.get('showLoginPopup'), true);
	});
});
