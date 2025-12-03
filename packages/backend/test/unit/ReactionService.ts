/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as assert from 'assert';
import { Test } from '@nestjs/testing';

import { CoreModule } from '@/core/CoreModule.js';
import { ReactionService } from '@/core/ReactionService.js';
import { GlobalModule } from '@/GlobalModule.js';

describe('ReactionService', () => {
	let reactionService: ReactionService;

	beforeAll(async () => {
		const app = await Test.createTestingModule({
			imports: [GlobalModule, CoreModule],
		}).compile();
		reactionService = app.get<ReactionService>(ReactionService);
	});

	describe('normalize', () => {
		test('絵文字リアクションはそのまま', () => {
			assert.strictEqual(reactionService.normalize('👍'), '👍');
			assert.strictEqual(reactionService.normalize('🍅'), '🍅');
		});

		test('既存のリアクションは絵文字化する pudding', () => {
			assert.strictEqual(reactionService.normalize('pudding'), '🍮');
		});

		test('既存のリアクションは絵文字化する like', () => {
			assert.strictEqual(reactionService.normalize('like'), '👍');
		});

		test('既存のリアクションは絵文字化する love', () => {
			assert.strictEqual(reactionService.normalize('love'), '❤');
		});

		test('既存のリアクションは絵文字化する laugh', () => {
			assert.strictEqual(reactionService.normalize('laugh'), '😆');
		});

		test('既存のリアクションは絵文字化する hmm', () => {
			assert.strictEqual(reactionService.normalize('hmm'), '🤔');
		});

		test('既存のリアクションは絵文字化する surprise', () => {
			assert.strictEqual(reactionService.normalize('surprise'), '😮');
		});

		test('既存のリアクションは絵文字化する congrats', () => {
			assert.strictEqual(reactionService.normalize('congrats'), '🎉');
		});

		test('既存のリアクションは絵文字化する angry', () => {
			assert.strictEqual(reactionService.normalize('angry'), '💢');
		});

		test('既存のリアクションは絵文字化する confused', () => {
			assert.strictEqual(reactionService.normalize('confused'), '😥');
		});

		test('既存のリアクションは絵文字化する rip', () => {
			assert.strictEqual(reactionService.normalize('rip'), '😇');
		});

		test('既存のリアクションは絵文字化する star', () => {
			assert.strictEqual(reactionService.normalize('star'), '⭐');
		});

		test('異体字セレクタ除去', () => {
			assert.strictEqual(reactionService.normalize('㊗️'), '㊗');
		});

		test('異体字セレクタ除去 必要なし', () => {
			assert.strictEqual(reactionService.normalize('㊗'), '㊗');
		});

		test('fallback - null', () => {
			assert.strictEqual(reactionService.normalize(null), '❤');
		});

		test('fallback - empty', () => {
			assert.strictEqual(reactionService.normalize(''), '❤');
		});

		test('fallback - unknown', () => {
			assert.strictEqual(reactionService.normalize('unknown'), '❤');
		});
	});

	describe('convertLegacyReactions', () => {
		test('空の入力に対しては何もしない', () => {
			const input = {};
			assert.deepStrictEqual(reactionService.convertLegacyReactions(input), input);
		});

		test('Unicode絵文字リアクションを変換してしまわない', () => {
			const input = { '👍': 1, '🍮': 2 };
			assert.deepStrictEqual(reactionService.convertLegacyReactions(input), input);
		});

		test('カスタム絵文字リアクションを変換してしまわない', () => {
			const input = { ':like@.:': 1, ':pudding@example.tld:': 2 };
			assert.deepStrictEqual(reactionService.convertLegacyReactions(input), input);
		});

		test('文字列によるレガシーなリアクションを変換する', () => {
			const input = { 'like': 1, 'pudding': 2 };
			const output = { '👍': 1, '🍮': 2 };
			assert.deepStrictEqual(reactionService.convertLegacyReactions(input), output);
		});

		test('host部分が省略されたレガシーなカスタム絵文字リアクションを変換する', () => {
			const input = { ':custom_emoji:': 1 };
			const output = { ':custom_emoji@.:': 1 };
			assert.deepStrictEqual(reactionService.convertLegacyReactions(input), output);
		});

		test('「0個のリアクション」情報を削除する', () => {
			const input = { 'angry': 0 };
			const output = {};
			assert.deepStrictEqual(reactionService.convertLegacyReactions(input), output);
		});

		test('host部分の有無によりデコードすると同じ表記になるカスタム絵文字リアクションの個数情報を正しく足し合わせる', () => {
			const input = { ':custom_emoji:': 1, ':custom_emoji@.:': 2 };
			const output = { ':custom_emoji@.:': 3 };
			assert.deepStrictEqual(reactionService.convertLegacyReactions(input), output);
		});
	});
});
