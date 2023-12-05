/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { UserProfilesRepository, NotesRepository, NoteReactionsRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueryService } from '@/core/QueryService.js';
import { NoteReactionEntityService } from '@/core/entities/NoteReactionEntityService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../error.js';
import { MiNoteReaction } from "@/models/_.js";

export const meta = {
	tags: ['users', 'reactions'],

	requireCredential: false,

	description: 'Show all reactions this user made.',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'NoteReaction',
		},
	},

	errors: {
		reactionsNotPublic: {
			message: 'Reactions of the user is not public.',
			code: 'REACTIONS_NOT_PUBLIC',
			id: '673a7dd2-6924-1093-e0c0-e68456ceae5c',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		sinceDate: { type: 'integer' },
		untilDate: { type: 'integer' },
	},
	required: ['userId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.noteReactionsRepository)
		private noteReactionsRepository: NoteReactionsRepository,

		private noteReactionEntityService: NoteReactionEntityService,
		private queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const profile = await this.userProfilesRepository.findOneByOrFail({ userId: ps.userId });

			if ((me == null || me.id !== ps.userId) && !profile.publicReactions) {
				throw new ApiError(meta.errors.reactionsNotPublic);
			}

			const query = this.notesRepository.createQueryBuilder('note')
				.innerJoinAndSelect(qb =>
					this.queryService.makePaginationQuery(
						qb
							.from(this.noteReactionsRepository.metadata.targetName, 'reaction')
							.where('"reaction"."userId" = :userId', { userId: ps.userId }),
						ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate
					),
					'reaction',
					'"reaction"."noteId" = note.id'
				);

			this.queryService.generateVisibilityQuery(query, me);

			const reactions = await query
				.limit(ps.limit)
				.getRawMany<MiNoteReaction>();

			return await this.noteReactionEntityService.packMany(reactions, me, { withNote: true });
		});
	}
}
