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

describe('toDbReaction', () => {
	it('既存の文字列リアクションはそのまま', () => {
		assert.strictEqual(toDbReaction('like'), 'like');
	});

	it('Unicodeプリンは寿司化不能とするため文字列化しない', () => {
		assert.strictEqual(toDbReaction('🍮'), '🍮');
	});

	it('プリン以外の既存のリアクションは文字列化する like', () => {
		assert.strictEqual(toDbReaction('👍'), 'like');
	});

	it('プリン以外の既存のリアクションは文字列化する love', () => {
		assert.strictEqual(toDbReaction('❤️'), 'love');
	});

	it('プリン以外の既存のリアクションは文字列化する love 異体字セレクタなし', () => {
		assert.strictEqual(toDbReaction('❤'), 'love');
	});

	it('プリン以外の既存のリアクションは文字列化する laugh', () => {
		assert.strictEqual(toDbReaction('😆'), 'laugh');
	});

	it('プリン以外の既存のリアクションは文字列化する hmm', () => {
		assert.strictEqual(toDbReaction('🤔'), 'hmm');
	});

	it('プリン以外の既存のリアクションは文字列化する surprise', () => {
		assert.strictEqual(toDbReaction('😮'), 'surprise');
	});

	it('プリン以外の既存のリアクションは文字列化する congrats', () => {
		assert.strictEqual(toDbReaction('🎉'), 'congrats');
	});

	it('プリン以外の既存のリアクションは文字列化する angry', () => {
		assert.strictEqual(toDbReaction('💢'), 'angry');
	});

	it('プリン以外の既存のリアクションは文字列化する confused', () => {
		assert.strictEqual(toDbReaction('😥'), 'confused');
	});

	it('プリン以外の既存のリアクションは文字列化する rip', () => {
		assert.strictEqual(toDbReaction('😇'), 'rip');
	});

	it('それ以外はUnicodeのまま', () => {
		assert.strictEqual(toDbReaction('🍅'), '🍅');
	});

	it('異体字セレクタ除去', () => {
		assert.strictEqual(toDbReaction('㊗️'), '㊗');
	});

	it('異体字セレクタ除去 必要なし', () => {
		assert.strictEqual(toDbReaction('㊗'), '㊗');
	});

	it('fallback star - undefined', () => {
		assert.strictEqual(toDbReaction(undefined), 'star');
	});

	it('fallback star - null', () => {
		assert.strictEqual(toDbReaction(null), 'star');
	});

	it('fallback star - empty', () => {
		assert.strictEqual(toDbReaction(''), 'star');
	});

	it('fallback star - unknown', () => {
		assert.strictEqual(toDbReaction('unknown'), 'star');
	});

	it('Unicode star は fallback star ではない', () => {
		assert.strictEqual(toDbReaction('⭐'), '⭐');
	});
});
