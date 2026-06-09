/*
 * SPDX-FileCopyrightText: Rickskey Project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { UsersRepository, NotesRepository, NoteReactionsRepository, FollowingsRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { IdService } from '@/core/IdService.js';

export const meta = {
	tags: ['rankings'],
	requireCredential: false,
	kind: 'read:rankings',

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			notes: { type: 'array', optional: false, nullable: false, items: { type: 'object' } },
			reactions: { type: 'array', optional: false, nullable: false, items: { type: 'object' } },
			followers: { type: 'array', optional: false, nullable: false, items: { type: 'object' } },
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		period: { type: 'string', enum: ['weekly', 'monthly', 'alltime'], default: 'weekly' },
		limit: { type: 'integer', minimum: 1, maximum: 50, default: 10 },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.noteReactionsRepository)
		private noteReactionsRepository: NoteReactionsRepository,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		private userEntityService: UserEntityService,
		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const now = new Date();
			let since: Date | null = null;

			if (ps.period === 'weekly') {
				since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
			} else if (ps.period === 'monthly') {
				since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
			}

			// ノート数ランキング
			const noteQuery = this.notesRepository.createQueryBuilder('note')
				.select('note.userId', 'userId')
				.addSelect('COUNT(*)', 'count')
				.where('note.userHost IS NULL')
				.andWhere('note.visibility = :vis', { vis: 'public' });

			if (since) {
				const sinceId = this.idService.gen(since.getTime());
				noteQuery.andWhere('note.id > :sinceId', { sinceId });
			}

			const noteRanking = await noteQuery
				.groupBy('note.userId')
				.orderBy('count', 'DESC')
				.limit(ps.limit)
				.getRawMany();

			// リアクション受信数ランキング
			const reactionQuery = this.noteReactionsRepository.createQueryBuilder('reaction')
				.select('note.userId', 'userId')
				.addSelect('COUNT(*)', 'count')
				.innerJoin('reaction.note', 'note')
				.where('note.userHost IS NULL');

			if (since) {
				const sinceId = this.idService.gen(since.getTime());
				reactionQuery.andWhere('reaction.id > :sinceId', { sinceId });
			}

			const reactionRanking = await reactionQuery
				.groupBy('note.userId')
				.orderBy('count', 'DESC')
				.limit(ps.limit)
				.getRawMany();

			// フォロワー増加数ランキング
			const followerQuery = this.followingsRepository.createQueryBuilder('following')
				.select('following.followeeId', 'userId')
				.addSelect('COUNT(*)', 'count')
				.where('following.followerHost IS NULL');

			if (since) {
				const sinceId = this.idService.gen(since.getTime());
				followerQuery.andWhere('following.id > :sinceId', { sinceId });
			}

			const followerRanking = await followerQuery
				.groupBy('following.followeeId')
				.orderBy('count', 'DESC')
				.limit(ps.limit)
				.getRawMany();

			// ユーザー情報を付与
			const enrichRanking = async (ranking: { userId: string; count: string }[]) => {
				return Promise.all(ranking.map(async (entry) => {
					const user = await this.usersRepository.findOneBy({ id: entry.userId });
					if (user == null) return null;
					const packed = await this.userEntityService.pack(user, me ?? null, { schema: 'UserLite' });
					return { user: packed, count: parseInt(entry.count, 10) };
				})).then(r => r.filter(x => x != null));
			};

			const [notes, reactions, followers] = await Promise.all([
				enrichRanking(noteRanking),
				enrichRanking(reactionRanking),
				enrichRanking(followerRanking),
			]);

			return { notes, reactions, followers };
		});
	}
}
