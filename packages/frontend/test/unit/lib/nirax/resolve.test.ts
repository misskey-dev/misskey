/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { assert, describe, test } from 'vitest';
import { createRouter } from './fixture.js';

describe('[NIRAX] resolve', () => {
	test('staticなルートを解決できる', () => {
		const router = createRouter();
		const resolved = router.resolve('/');

		assert.ok(resolved);
		assert.strictEqual(resolved.route.path, '/');
		assert.strictEqual(resolved.props.size, 0);
	});

	test('パスパラメータ付きルートを解決できる', () => {
		const router = createRouter();
		const resolved = router.resolve('/posts/abc%2Fdef');

		assert.ok(resolved);
		assert.strictEqual(resolved.route.path, '/posts/:postId');
		assert.strictEqual(resolved.props.get('postId'), 'abc/def');
	});

	test('queryとhashのエイリアスを解決できる', () => {
		const router = createRouter();
		const resolved = router.resolve('/posts/abc?from=timeline#thread');

		assert.ok(resolved);
		assert.strictEqual(resolved.props.get('source'), 'timeline');
		assert.strictEqual(resolved.props.get('section'), 'thread');
	});

	test('wildcardルートのパラメータを解決できる', () => {
		const router = createRouter();
		const resolved = router.resolve('/files/images/icons/logo%20mark.svg');

		assert.ok(resolved);
		assert.strictEqual(resolved.route.path, '/files/:path(*)');
		assert.strictEqual(resolved.props.get('path'), 'images/icons/logo mark.svg');
	});

	test('optionalなパスパラメータが省略されたルートを解決できる', () => {
		const router = createRouter();
		const resolved = router.resolve('/optional');

		assert.ok(resolved);
		assert.strictEqual(resolved.route.path, '/optional/:slug?');
		assert.strictEqual(resolved.props.has('slug'), false);
	});

	test('optionalなパスパラメータが存在するルートを解決できる', () => {
		const router = createRouter();
		const resolved = router.resolve('/optional/topic');

		assert.ok(resolved);
		assert.strictEqual(resolved.props.get('slug'), 'topic');
	});

	test('ネストされたルートを解決できる', () => {
		const router = createRouter();
		const resolved = router.resolve('/user/alice/followers');

		assert.ok(resolved);
		assert.strictEqual(resolved.route.path, '/user/:id');
		assert.strictEqual(resolved.props.get('id'), 'alice');
		assert.ok(resolved.child);
		assert.strictEqual(resolved.child.route.path, '/followers');
	});
});
