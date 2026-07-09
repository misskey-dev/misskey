/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { assert, describe, test } from 'vitest';
import { createRouter } from './fixture.js';

describe('[NIRAX] ナビゲーションイベント', () => {
	test('init時にリダイレクトを解決してreplaceを発火する', () => {
		const router = createRouter('/old?from=legacy#intro');
		const changes: string[] = [];
		const replacements: string[] = [];

		router.addListener('change', ctx => {
			changes.push(ctx.fullPath);
		});
		router.addListener('replace', ctx => {
			replacements.push(ctx.fullPath);
		});

		router.init();

		assert.strictEqual(router.getCurrentFullPath(), '/posts/redirected?from=legacy#intro');
		assert.strictEqual(router.current.redirected, true);
		assert.deepStrictEqual(changes, []); // 初回はchangeを発火しない
		assert.deepStrictEqual(replacements, ['/posts/redirected?from=legacy#intro']);
	});

	test('push時に動的リダイレクトを解決してpushとchangeを発火する', () => {
		const router = createRouter('/');
		const pushed: string[] = [];
		const changed: string[] = [];

		router.addListener('push', ctx => {
			pushed.push(ctx.fullPath);
			assert.strictEqual(ctx.route?.path, '/posts/:postId');
			assert.strictEqual(ctx.props?.get('postId'), 'abc123');
		});
		router.addListener('change', ctx => {
			changed.push(ctx.fullPath);
		});

		router.init();

		router.pushByPath('/legacy/abc123');

		assert.strictEqual(router.getCurrentFullPath(), '/posts/abc123');
		assert.deepStrictEqual(pushed, ['/posts/abc123']);
		assert.deepStrictEqual(changed, ['/posts/abc123']);
	});

	test('無限リダイレクトはエラーになる', () => {
		const router = createRouter('/');

		router.init();

		assert.throws(() => {
			router.pushByPath('/loop-a');
		}, /redirect loop detected/);
		assert.strictEqual(router.getCurrentFullPath(), '/');
	});

	test('同じパスへの遷移ではsameを発火する', () => {
		const router = createRouter('/posts/123');
		let sameCount = 0;
		let pushCount = 0;

		router.addListener('same', () => {
			sameCount++;
		});
		router.addListener('push', () => {
			pushCount++;
		});

		router.init();

		router.pushByPath('/posts/123');

		assert.strictEqual(sameCount, 1);
		assert.strictEqual(pushCount, 0); // sameのときはpushを発火しない
	});

	test('navHookでナビゲーションをキャンセルできる', () => {
		const router = createRouter('/posts/123');
		const navHookCalls: string[] = [];
		let pushCount = 0;

		router.addListener('push', () => {
			pushCount++;
		});
		router.navHook = fullPath => {
			navHookCalls.push(fullPath);
			return true;
		};

		router.init();

		router.pushByPath('/posts/456');

		assert.deepStrictEqual(navHookCalls, ['/posts/456']);
		assert.strictEqual(pushCount, 0);
		assert.strictEqual(router.getCurrentFullPath(), '/posts/123');
	});
});
