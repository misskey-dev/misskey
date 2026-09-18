/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { MoreThan } from 'typeorm';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { BubbleGameRecordsRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { packedUserLiteSchema } from '@/models/schema/user.js';

export const meta = {
	allowGet: true,
	cacheSec: 60,

	errors: {
	},

	res: v.array(v.object({
		id: v.pipe(v.string(), mi.format('misskey:id')),
		score: mi.integer(),
		user: v.optional(packedUserLiteSchema),
	})),
} as const;

export const paramDef = v.object({
	gameMode: v.string(),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.bubbleGameRecordsRepository)
		private bubbleGameRecordsRepository: BubbleGameRecordsRepository,

		private userEntityService: UserEntityService,
	) {
		super(meta, paramDef, async (ps) => {
			const records = await this.bubbleGameRecordsRepository.find({
				where: {
					gameMode: ps.gameMode,
					seededAt: MoreThan(new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)),
				},
				order: {
					score: 'DESC',
				},
				take: 10,
				relations: { user: true },
			});

			const users = await this.userEntityService.packMany(records.map(r => r.user!), null);

			return records.map(r => ({
				id: r.id,
				score: r.score,
				user: users.find(u => u.id === r.user!.id),
			}));
		});
	}
}
