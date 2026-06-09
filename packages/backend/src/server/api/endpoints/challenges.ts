/*
 * SPDX-FileCopyrightText: Rickskey Project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { CommunityChallengesRepository, NotesRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { IdService } from '@/core/IdService.js';

export const meta = {
	tags: ['challenges'],
	requireCredential: false,
	kind: 'read:challenges',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			properties: {
				id: { type: 'string', optional: false, nullable: false },
				createdAt: { type: 'string', optional: false, nullable: false },
				title: { type: 'string', optional: false, nullable: false },
				description: { type: 'string', optional: true, nullable: true },
				hashtag: { type: 'string', optional: false, nullable: false },
				deadline: { type: 'string', optional: true, nullable: true },
				isActive: { type: 'boolean', optional: false, nullable: false },
				participantCount: { type: 'number', optional: false, nullable: false },
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		status: { type: 'string', enum: ['active', 'closed', 'all'], default: 'active' },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 30 },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.communityChallengesRepository)
		private communityChallengesRepository: CommunityChallengesRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private idService: IdService,
	) {
		super(meta, paramDef, async (ps) => {
			const query = this.communityChallengesRepository.createQueryBuilder('challenge')
				.orderBy('challenge.id', 'DESC')
				.limit(ps.limit);

			if (ps.status === 'active') {
				query.where('challenge.isActive = true');
			} else if (ps.status === 'closed') {
				query.where('challenge.isActive = false');
			}

			const challenges = await query.getMany();

			return Promise.all(challenges.map(async c => {
				const participantCount = await this.notesRepository.createQueryBuilder('note')
					.where('note.tags @> ARRAY[:tag]::varchar[]', { tag: c.hashtag })
					.andWhere('note.userHost IS NULL')
					.select('COUNT(DISTINCT note.userId)', 'cnt')
					.getRawOne().then(r => parseInt(r?.cnt ?? '0', 10));

				return {
					id: c.id,
					createdAt: this.idService.parse(c.id).date.toISOString(),
					title: c.title,
					description: c.description ?? null,
					hashtag: c.hashtag,
					deadline: c.deadline ? c.deadline.toISOString() : null,
					isActive: c.isActive,
					participantCount,
				};
			}));
		});
	}
}
