/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, test } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import type * as Bull from 'bullmq';
import type { UsersRepository } from '@/models/_.js';
import type { MiUser } from '@/models/User.js';
import { RelationshipProcessorService } from '@/queue/processors/RelationshipProcessorService.js';
import { QueueLoggerService } from '@/queue/QueueLoggerService.js';
import { UserFollowingService } from '@/core/UserFollowingService.js';
import { UserBlockingService } from '@/core/UserBlockingService.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import { DI } from '@/di-symbols.js';
import type { RelationshipJobData } from '@/queue/types.js';

describe('RelationshipProcessorService', () => {
	let service: RelationshipProcessorService;
	const users = mockDeep<UsersRepository>();
	const userFollowingService = mockDeep<UserFollowingService>();
	const userBlockingService = mockDeep<UserBlockingService>();
	const job = { data: { from: { id: 'from' }, to: { id: 'to' } } } as Bull.Job<RelationshipJobData>;

	beforeEach(async () => {
		mockReset(users);
		mockReset(userFollowingService);
		mockReset(userBlockingService);
		const queueLoggerService = mockDeep<QueueLoggerService>();
		queueLoggerService.logger.createSubLogger.mockReturnValue(mockDeep());
		const module = await Test.createTestingModule({
			providers: [
				RelationshipProcessorService,
				{ provide: DI.usersRepository, useValue: users },
				{ provide: QueueLoggerService, useValue: queueLoggerService },
				{ provide: UserFollowingService, useValue: userFollowingService },
				{ provide: UserBlockingService, useValue: userBlockingService },
			],
		}).compile();
		service = module.get(RelationshipProcessorService);
		users.findOneByOrFail.mockResolvedValue({ id: 'user', host: null } as MiUser);
	});

	// インポート等のジョブが交流を断てないユーザーを対象にしていた場合、リトライさせずに完了扱いにする
	describe.each([
		{
			name: 'processUnfollow',
			process: (job: Bull.Job<RelationshipJobData>) => service.processUnfollow(job),
			mock: () => userFollowingService.unfollow,
			policyErrorId: '19f25f61-0141-4683-99dc-217a88d633cb',
		},
		{
			name: 'processBlock',
			process: (job: Bull.Job<RelationshipJobData>) => service.processBlock(job),
			mock: () => userBlockingService.block,
			policyErrorId: 'e2f04d25-0d94-4ac3-a4d8-ba401062741b',
		},
	])('$name', ({ process, mock, policyErrorId }) => {
		test('サーバーポリシーによる拒否はジョブを成功扱いにする', async () => {
			mock().mockRejectedValue(new IdentifiableError(policyErrorId));

			await expect(process(job)).resolves.toBe('ok');
		});

		test('それ以外のエラーは伝播させる', async () => {
			const error = new Error('DB error');
			mock().mockRejectedValue(error);

			await expect(process(job)).rejects.toBe(error);
		});
	});
});
