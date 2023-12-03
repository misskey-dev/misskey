/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Not, In, IsNull } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import { maximum } from '@/misc/prelude/array.js';
import type { NotesRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { DI } from '@/di-symbols.js';
import { GetterService } from '@/server/api/GetterService.js';
import { CacheService } from '@/core/CacheService.js';
import { isUserRelated } from '@/misc/is-user-related.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['users'],

	requireCredential: false,

	description: 'Get a list of other users that the specified user frequently replies to.',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			properties: {
				user: {
					type: 'object',
					optional: false, nullable: false,
					ref: 'UserDetailed',
				},
				weight: {
					type: 'number',
					optional: false, nullable: false,
				},
			},
		},
	},

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: 'e6965129-7b2a-40a4-bae2-cd84cd434822',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
	},
	required: ['userId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private userEntityService: UserEntityService,
		private getterService: GetterService,
		private cacheService: CacheService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// Lookup user
			const user = await this.getterService.getUser(ps.userId).catch(err => {
				if (err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(meta.errors.noSuchUser);
				throw err;
			});

			// Fetch recent notes
			const recentNotes = await this.notesRepository.find({
				where: {
					userId: user.id,
					replyId: Not(IsNull()),
				},
				order: {
					id: -1,
				},
				take: 1000,
				select: ['replyId'],
			});

			// 投稿が少なかったら中断
			if (recentNotes.length === 0) {
				return [];
			}

			const [
				userIdsWhoMeMuting,
				userIdsWhoBlockingMe,
			] = me ? await Promise.all([
				this.cacheService.userMutingsCache.fetch(me.id),
				this.cacheService.userBlockedCache.fetch(me.id),
			]) : [new Set<string>(), new Set<string>()];

			const replyTargetNotes = (await this.notesRepository.find({
				where: {
					id: In(recentNotes.map(p => p.replyId)),
				},
				select: ['userId'],
			})).filter(note => !(me && (isUserRelated(note, userIdsWhoBlockingMe) || isUserRelated(note, userIdsWhoMeMuting))));

			const repliedUsers: any = {};

			// Extract replies from recent notes
			for (const userId of replyTargetNotes.map(x => x.userId.toString())) {
				if (repliedUsers[userId]) {
					repliedUsers[userId]++;
				} else {
					repliedUsers[userId] = 1;
				}
			}

			// Calc peak
			const peak = maximum(Object.values(repliedUsers));

			// Sort replies by frequency
			const repliedUsersSorted = Object.keys(repliedUsers).sort((a, b) => repliedUsers[b] - repliedUsers[a]);

			// Extract top replied users
			const topRepliedUsers = repliedUsersSorted.slice(0, ps.limit);

			// Make replies object (includes weights)
			const repliesObj = await Promise.all(topRepliedUsers.map(async (user) => ({
				user: await this.userEntityService.pack(user, me, { detail: true }),
				weight: repliedUsers[user] / peak,
			})));

			return repliesObj;
		});
	}
}
