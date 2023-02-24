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

	describe('toDbReaction', () => {
		test('絵文字リアクションはそのまま', async () => {
			assert.strictEqual(await reactionService.toDbReaction('👍'), '👍');
			assert.strictEqual(await reactionService.toDbReaction('🍅'), '🍅');
		});

		test('既存のリアクションは絵文字化する pudding', async () => {
			assert.strictEqual(await reactionService.toDbReaction('pudding'), '🍮');
		});

		test('既存のリアクションは絵文字化する like', async () => {
			assert.strictEqual(await reactionService.toDbReaction('like'), '👍');
		});

		test('既存のリアクションは絵文字化する love', async () => {
			assert.strictEqual(await reactionService.toDbReaction('love'), '❤');
		});

		test('既存のリアクションは絵文字化する laugh', async () => {
			assert.strictEqual(await reactionService.toDbReaction('laugh'), '😆');
		});

		test('既存のリアクションは絵文字化する hmm', async () => {
			assert.strictEqual(await reactionService.toDbReaction('hmm'), '🤔');
		});

		test('既存のリアクションは絵文字化する surprise', async () => {
			assert.strictEqual(await reactionService.toDbReaction('surprise'), '😮');
		});

		test('既存のリアクションは絵文字化する congrats', async () => {
			assert.strictEqual(await reactionService.toDbReaction('congrats'), '🎉');
		});

		test('既存のリアクションは絵文字化する angry', async () => {
			assert.strictEqual(await reactionService.toDbReaction('angry'), '💢');
		});

		test('既存のリアクションは絵文字化する confused', async () => {
			assert.strictEqual(await reactionService.toDbReaction('confused'), '😥');
		});

		test('既存のリアクションは絵文字化する rip', async () => {
			assert.strictEqual(await reactionService.toDbReaction('rip'), '😇');
		});

		test('既存のリアクションは絵文字化する star', async () => {
			assert.strictEqual(await reactionService.toDbReaction('star'), '⭐');
		});

		test('異体字セレクタ除去', async () => {
			assert.strictEqual(await reactionService.toDbReaction('㊗️'), '㊗');
		});

		test('異体字セレクタ除去 必要なし', async () => {
			assert.strictEqual(await reactionService.toDbReaction('㊗'), '㊗');
		});

		test('fallback - undefined', async () => {
			assert.strictEqual(await reactionService.toDbReaction(undefined), '👍');
		});

		test('fallback - null', async () => {
			assert.strictEqual(await reactionService.toDbReaction(null), '👍');
		});

		test('fallback - empty', async () => {
			assert.strictEqual(await reactionService.toDbReaction(''), '👍');
		});

		test('fallback - unknown', async () => {
			assert.strictEqual(await reactionService.toDbReaction('unknown'), '👍');
		});
	});
});
