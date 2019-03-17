/*
 * Tests of MFM
 *
 * How to run the tests:
 * > mocha test/reaction-lib.ts --require ts-node/register
 *
 * To specify test:
 * > mocha test/reaction-lib.ts --require ts-node/register -g 'test name'
 */

import * as assert from 'assert';

import { toDbReaction } from '../src/misc/reaction-lib';

describe('toDbReaction', async () => {
	it('既存の文字列リアクションはそのまま', async () => {
		assert.strictEqual(await toDbReaction('like'), 'like');
	});

	it('Unicodeプリンは寿司化不能とするため文字列化しない', async () => {
		assert.strictEqual(await toDbReaction('🍮'), '🍮');
	});

	it('プリン以外の既存のリアクションは文字列化する like', async () => {
		assert.strictEqual(await toDbReaction('👍'), 'like');
	});

	it('プリン以外の既存のリアクションは文字列化する love', async () => {
		assert.strictEqual(await toDbReaction('❤️'), 'love');
	});

	it('プリン以外の既存のリアクションは文字列化する love 異体字セレクタなし', async () => {
		assert.strictEqual(await toDbReaction('❤'), 'love');
	});

	it('プリン以外の既存のリアクションは文字列化する laugh', async () => {
		assert.strictEqual(await toDbReaction('😆'), 'laugh');
	});

	it('プリン以外の既存のリアクションは文字列化する hmm', async () => {
		assert.strictEqual(await toDbReaction('🤔'), 'hmm');
	});

	it('プリン以外の既存のリアクションは文字列化する surprise', async () => {
		assert.strictEqual(await toDbReaction('😮'), 'surprise');
	});

	it('プリン以外の既存のリアクションは文字列化する congrats', async () => {
		assert.strictEqual(await toDbReaction('🎉'), 'congrats');
	});

	it('プリン以外の既存のリアクションは文字列化する angry', async () => {
		assert.strictEqual(await toDbReaction('💢'), 'angry');
	});

	it('プリン以外の既存のリアクションは文字列化する confused', async () => {
		assert.strictEqual(await toDbReaction('😥'), 'confused');
	});

	it('プリン以外の既存のリアクションは文字列化する rip', async () => {
		assert.strictEqual(await toDbReaction('😇'), 'rip');
	});

	it('それ以外はUnicodeのまま', async () => {
		assert.strictEqual(await toDbReaction('🍅'), '🍅');
	});

	it('異体字セレクタ除去', async () => {
		assert.strictEqual(await toDbReaction('㊗️'), '㊗');
	});

	it('異体字セレクタ除去 必要なし', async () => {
		assert.strictEqual(await toDbReaction('㊗'), '㊗');
	});

	it('fallback star - undefined', async () => {
		assert.strictEqual(await toDbReaction(undefined), 'star');
	});

	it('fallback star - null', async () => {
		assert.strictEqual(await toDbReaction(null), 'star');
	});

	it('fallback star - empty', async () => {
		assert.strictEqual(await toDbReaction(''), 'star');
	});

	it('fallback star - unknown', async () => {
		assert.strictEqual(await toDbReaction('unknown'), 'star');
	});

	it('Unicode star は fallback star ではない', async () => {
		assert.strictEqual(await toDbReaction('⭐'), '⭐');
	});
});
