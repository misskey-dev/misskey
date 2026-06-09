/*
 * SPDX-FileCopyrightText: Rickskey Project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { MoreThan, LessThan } from 'typeorm';
import type { CommunityChallengesRepository, NotesRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { IdService } from '@/core/IdService.js';

export const meta = {
	tags: ['daily-prompt'],
	requireCredential: false,
	kind: 'read:daily-prompt',

	res: {
		type: 'object',
		optional: false, nullable: true,
		properties: {
			id: { type: 'string', optional: false, nullable: false },
			createdAt: { type: 'string', optional: false, nullable: false },
			title: { type: 'string', optional: false, nullable: false },
			description: { type: 'string', optional: true, nullable: true },
			hashtag: { type: 'string', optional: false, nullable: false },
			deadline: { type: 'string', optional: true, nullable: true },
			participantCount: { type: 'number', optional: false, nullable: false },
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
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
		super(meta, paramDef, async () => {
			const now = new Date();

			// 最新のアクティブな日替わりお題を取得
			const prompt = await this.communityChallengesRepository.findOne({
				where: {
					isDailyPrompt: true,
					isActive: true,
				},
				order: { id: 'DESC' },
			});

			if (prompt == null) return null;

			// 期限切れチェック
			if (prompt.deadline && prompt.deadline < now) return null;

			const participantCount = await this.notesRepository.createQueryBuilder('note')
				.where('note.tags @> ARRAY[:tag]::varchar[]', { tag: prompt.hashtag })
				.andWhere('note.userHost IS NULL')
				.select('COUNT(DISTINCT note.userId)', 'cnt')
				.getRawOne().then(r => parseInt(r?.cnt ?? '0', 10));

			return {
				id: prompt.id,
				createdAt: this.idService.parse(prompt.id).date.toISOString(),
				title: prompt.title,
				description: prompt.description ?? null,
				hashtag: prompt.hashtag,
				deadline: prompt.deadline ? prompt.deadline.toISOString() : null,
				participantCount,
			};
		});
	}
}
