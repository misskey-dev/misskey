/*
import * as assert from 'assert';

import { toDbReaction } from '../src/misc/reaction-lib.js';

describe('toDbReaction', async () => {
	test('既存の文字列リアクションはそのまま', async () => {
		assert.strictEqual(await toDbReaction('like'), 'like');
	});

	test('Unicodeプリンは寿司化不能とするため文字列化しない', async () => {
		assert.strictEqual(await toDbReaction('🍮'), '🍮');
	});

	test('プリン以外の既存のリアクションは文字列化する like', async () => {
		assert.strictEqual(await toDbReaction('👍'), 'like');
	});

	test('プリン以外の既存のリアクションは文字列化する love', async () => {
		assert.strictEqual(await toDbReaction('❤️'), 'love');
	});

	test('プリン以外の既存のリアクションは文字列化する love 異体字セレクタなし', async () => {
		assert.strictEqual(await toDbReaction('❤'), 'love');
	});

	test('プリン以外の既存のリアクションは文字列化する laugh', async () => {
		assert.strictEqual(await toDbReaction('😆'), 'laugh');
	});

	test('プリン以外の既存のリアクションは文字列化する hmm', async () => {
		assert.strictEqual(await toDbReaction('🤔'), 'hmm');
	});

	test('プリン以外の既存のリアクションは文字列化する surprise', async () => {
		assert.strictEqual(await toDbReaction('😮'), 'surprise');
	});

	test('プリン以外の既存のリアクションは文字列化する congrats', async () => {
		assert.strictEqual(await toDbReaction('🎉'), 'congrats');
	});

	test('プリン以外の既存のリアクションは文字列化する angry', async () => {
		assert.strictEqual(await toDbReaction('💢'), 'angry');
	});

	test('プリン以外の既存のリアクションは文字列化する confused', async () => {
		assert.strictEqual(await toDbReaction('😥'), 'confused');
	});

	test('プリン以外の既存のリアクションは文字列化する rip', async () => {
		assert.strictEqual(await toDbReaction('😇'), 'rip');
	});

	test('それ以外はUnicodeのまま', async () => {
		assert.strictEqual(await toDbReaction('🍅'), '🍅');
	});

	test('異体字セレクタ除去', async () => {
		assert.strictEqual(await toDbReaction('㊗️'), '㊗');
	});

	test('異体字セレクタ除去 必要なし', async () => {
		assert.strictEqual(await toDbReaction('㊗'), '㊗');
	});

	test('fallback - undefined', async () => {
		assert.strictEqual(await toDbReaction(undefined), 'like');
	});

	test('fallback - null', async () => {
		assert.strictEqual(await toDbReaction(null), 'like');
	});

	test('fallback - empty', async () => {
		assert.strictEqual(await toDbReaction(''), 'like');
	});

	test('fallback - unknown', async () => {
		assert.strictEqual(await toDbReaction('unknown'), 'like');
	});
});
*/
