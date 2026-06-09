/*
 * SPDX-FileCopyrightText: Rickskey Project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { CommunityChallengesRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { IdService } from '@/core/IdService.js';

export const meta = {
	tags: ['admin'],
	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:challenges',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: { type: 'object' },
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		status: { type: 'string', enum: ['active', 'closed', 'all'], default: 'all' },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.communityChallengesRepository)
		private communityChallengesRepository: CommunityChallengesRepository,

		private idService: IdService,
	) {
		super(meta, paramDef, async (ps) => {
			const query = this.communityChallengesRepository.createQueryBuilder('challenge')
				.orderBy('challenge.id', 'DESC');

			if (ps.status === 'active') {
				query.where('challenge.isActive = true');
			} else if (ps.status === 'closed') {
				query.where('challenge.isActive = false');
			}

			const challenges = await query.getMany();

			return challenges.map(c => ({
				id: c.id,
				createdAt: this.idService.parse(c.id).date.toISOString(),
				createdById: c.createdById,
				title: c.title,
				description: c.description ?? null,
				hashtag: c.hashtag,
				deadline: c.deadline ? c.deadline.toISOString() : null,
				isActive: c.isActive,
			}));
		});
	}
}
