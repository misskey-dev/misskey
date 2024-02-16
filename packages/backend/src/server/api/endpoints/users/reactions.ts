/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { UserProfilesRepository, NoteReactionsRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueryService } from '@/core/QueryService.js';
import { NoteReactionEntityService } from '@/core/entities/NoteReactionEntityService.js';
import { DI } from '@/di-symbols.js';
import { CacheService } from '@/core/CacheService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { RoleService } from '@/core/RoleService.js';
import { ApiError } from '../../error.js';

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
		isRemoteUser: {
			message: 'Currently unavailable to display reactions of remote users. See https://github.com/misskey-dev/misskey/issues/12964',
			code: 'IS_REMOTE_USER',
			id: '6b95fa98-8cf9-2350-e284-f0ffdb54a805',
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

		@Inject(DI.noteReactionsRepository)
		private noteReactionsRepository: NoteReactionsRepository,

		private cacheService: CacheService,
		private userEntityService: UserEntityService,
		private noteReactionEntityService: NoteReactionEntityService,
		private queryService: QueryService,
		private roleService: RoleService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const iAmModerator = me ? await this.roleService.isModerator(me) : false; // Moderators can see reactions of all users
			if (!iAmModerator) {
				const user = await this.cacheService.findUserById(ps.userId);
				if (this.userEntityService.isRemoteUser(user)) {
					throw new ApiError(meta.errors.isRemoteUser);
				}

				const profile = await this.userProfilesRepository.findOneByOrFail({ userId: ps.userId });
				if ((me == null || me.id !== ps.userId) && !profile.publicReactions) {
					throw new ApiError(meta.errors.reactionsNotPublic);
				}
			}

			const query = this.queryService.makePaginationQuery(this.noteReactionsRepository.createQueryBuilder('reaction'),
				ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('reaction.userId = :userId', { userId: ps.userId })
				.leftJoinAndSelect('reaction.note', 'note');

			this.queryService.generateVisibilityQuery(query, me);

			const reactions = await query
				.limit(ps.limit)
				.getMany();

			return await Promise.all(reactions.map(reaction => this.noteReactionEntityService.pack(reaction, me, { withNote: true })));
		});
	}
}
