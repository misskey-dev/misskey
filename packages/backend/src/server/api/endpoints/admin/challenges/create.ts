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
	kind: 'write:admin:challenges',

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			id: { type: 'string', optional: false, nullable: false },
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		title: { type: 'string', minLength: 1, maxLength: 256 },
		description: { type: 'string', maxLength: 2048, nullable: true, default: null },
		hashtag: { type: 'string', minLength: 1, maxLength: 128 },
		deadline: { type: 'string', format: 'date-time', nullable: true, default: null },
		isDailyPrompt: { type: 'boolean', default: false },
	},
	required: ['title', 'hashtag'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.communityChallengesRepository)
		private communityChallengesRepository: CommunityChallengesRepository,

		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const challenge = await this.communityChallengesRepository.insertOne({
				id: this.idService.gen(),
				createdById: me.id,
				title: ps.title,
				description: ps.description ?? null,
				hashtag: ps.hashtag.replace(/^#/, ''),
				deadline: ps.deadline ? new Date(ps.deadline) : null,
				isActive: true,
				isDailyPrompt: ps.isDailyPrompt ?? false,
			});

			return { id: challenge.id };
		});
	}
}
