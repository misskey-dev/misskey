/*
 * SPDX-FileCopyrightText: Rickskey Project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { UsersRepository, NotesRepository, NoteReactionsRepository, FollowingsRepository, SigninsRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@/server/api/error.js';
import { IdService } from '@/core/IdService.js';

export const meta = {
	tags: ['admin'],
	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:user-activity',

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
		},
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			userId: { type: 'string', optional: false, nullable: false },
			notesCount: { type: 'number', optional: false, nullable: false },
			reactionsGiven: { type: 'number', optional: false, nullable: false },
			reactionsReceived: { type: 'number', optional: false, nullable: false },
			followersCount: { type: 'number', optional: false, nullable: false },
			followingCount: { type: 'number', optional: false, nullable: false },
			recentNotes: { type: 'array', optional: false, nullable: false, items: { type: 'object' } },
			recentSignins: { type: 'array', optional: false, nullable: false, items: { type: 'object' } },
			dailyActivity: { type: 'array', optional: false, nullable: false, items: { type: 'object' } },
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
		days: { type: 'integer', minimum: 1, maximum: 90, default: 30 },
	},
	required: ['userId'],
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

		@Inject(DI.signinsRepository)
		private signinsRepository: SigninsRepository,

		private idService: IdService,
	) {
		super(meta, paramDef, async (ps) => {
			const user = await this.usersRepository.findOneBy({ id: ps.userId });
			if (user == null) throw new ApiError(meta.errors.noSuchUser);

			const since = new Date(Date.now() - ps.days * 24 * 60 * 60 * 1000);
			const sinceId = this.idService.gen(since.getTime());

			const [
				notesCount,
				reactionsGiven,
				reactionsReceived,
				followersCount,
				followingCount,
				recentNotes,
				recentSignins,
			] = await Promise.all([
				this.notesRepository.countBy({ userId: user.id }),
				this.noteReactionsRepository.countBy({ userId: user.id }),
				// リアクションを受け取った数: 自分のノートへのリアクション
				this.noteReactionsRepository.createQueryBuilder('reaction')
					.innerJoin('reaction.note', 'note')
					.where('note.userId = :userId', { userId: user.id })
					.getCount(),
				this.followingsRepository.countBy({ followeeId: user.id }),
				this.followingsRepository.countBy({ followerId: user.id }),
				this.notesRepository.find({
					where: { userId: user.id },
					order: { id: 'DESC' },
					take: 10,
					select: ['id', 'text', 'visibility'],
				}),
				this.signinsRepository.find({
					where: { userId: user.id },
					order: { id: 'DESC' },
					take: 20,
				}),
			]);

			// 日別ノート投稿数（過去N日）
			const dailyRaw = await this.notesRepository.createQueryBuilder('note')
				.select("DATE_TRUNC('day', note.createdAt)", 'day')
				.addSelect('COUNT(*)', 'count')
				.where('note.userId = :userId', { userId: user.id })
				.andWhere('note.createdAt >= :since', { since })
				.groupBy("DATE_TRUNC('day', note.createdAt)")
				.orderBy('day', 'ASC')
				.getRawMany();

			const dailyActivity = dailyRaw.map(r => ({
				date: new Date(r.day).toISOString().slice(0, 10),
				notes: parseInt(r.count, 10),
			}));

			return {
				userId: user.id,
				notesCount,
				reactionsGiven,
				reactionsReceived: reactionsReceived as number,
				followersCount,
				followingCount,
				recentNotes: recentNotes.map(n => ({
					id: n.id,
					createdAt: this.idService.parse(n.id).date.toISOString(),
					text: n.text,
					visibility: n.visibility,
				})),
				recentSignins: recentSignins.map(s => ({
					id: s.id,
					createdAt: this.idService.parse(s.id).date.toISOString(),
					ip: s.ip,
					success: s.success,
				})),
				dailyActivity,
			};
		});
	}
}
