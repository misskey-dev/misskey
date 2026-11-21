/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { IsNull, MoreThan } from 'typeorm';
import ms from 'ms';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { MutingsRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { GetterService } from '@/server/api/GetterService.js';
import { UserMutingService } from '@/core/UserMutingService.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['account'],

	requireCredential: true,
	prohibitMoved: true,

	kind: 'write:mutes',

	limit: {
		duration: ms('1hour'),
		max: 20,
	},

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '6fef56f3-e765-4957-88e5-c6f65329b8a5',
		},

		muteeIsYourself: {
			message: 'Mutee is yourself.',
			code: 'MUTEE_IS_YOURSELF',
			id: 'a4619cb2-5f23-484b-9301-94c903074e10',
		},

		alreadyMuting: {
			message: 'You are already muting that user.',
			code: 'ALREADY_MUTING',
			id: '7e7359cb-160c-4956-b08f-4d1c653cd007',
		},

		expiresAtIsPast: {
			message: 'Cannot set past date to "expiresAt".',
			code: 'EXPIRES_AT_IS_PAST',
			id: 'e8f5b7e2-4d7a-4f4f-b1e1-2e8b9a6b3f0a',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
		expiresAt: {
			type: 'integer',
			nullable: true,
			description: 'A Unix Epoch timestamp that must lie in the future. `null` means an indefinite mute.',
		},
	},
	required: ['userId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.mutingsRepository)
		private mutingsRepository: MutingsRepository,

		private getterService: GetterService,
		private userMutingService: UserMutingService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const muter = me;

			// 自分自身
			if (me.id === ps.userId) {
				throw new ApiError(meta.errors.muteeIsYourself);
			}

			// Get mutee
			const mutee = await this.getterService.getUser(ps.userId).catch(err => {
				if (err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(meta.errors.noSuchUser);
				throw err;
			});

			// Check if already muting
			// 期限切れのミュートは、期限切れデータを削除する定期ジョブが実行されるまでの間、
			// 存在しないものとして扱う（期限切れ後すぐに再ミュートできるようにするため）
			const exist = await this.mutingsRepository.exists({
				where: [
					{
						muterId: muter.id,
						muteeId: mutee.id,
						expiresAt: IsNull(),
					},
					{
						muterId: muter.id,
						muteeId: mutee.id,
						expiresAt: MoreThan(new Date()),
					},
				],
			});

			if (exist) {
				throw new ApiError(meta.errors.alreadyMuting);
			}

			// Check if expiresAt is past
			if (ps.expiresAt && ps.expiresAt <= Date.now()) {
				throw new ApiError(meta.errors.expiresAtIsPast);
			}

			await this.userMutingService.mute(muter, mutee, ps.expiresAt ? new Date(ps.expiresAt) : null);
		});
	}
}
