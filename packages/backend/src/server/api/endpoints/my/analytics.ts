/*
 * SPDX-FileCopyrightText: Rickskey Project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { NotesRepository, NoteReactionsRepository, FollowingsRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { IdService } from '@/core/IdService.js';

export const meta = {
	tags: ['account'],
	requireCredential: true,
	kind: 'read:account',

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			totalNotes: { type: 'number', optional: false, nullable: false },
			totalReactionsReceived: { type: 'number', optional: false, nullable: false },
			followersCount: { type: 'number', optional: false, nullable: false },
			topNotes: { type: 'array', optional: false, nullable: false, items: { type: 'object' } },
			dailyNotes: { type: 'array', optional: false, nullable: false, items: { type: 'object' } },
			followerHistory: { type: 'array', optional: false, nullable: false, items: { type: 'object' } },
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		days: { type: 'integer', minimum: 7, maximum: 90, default: 30 },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.noteReactionsRepository)
		private noteReactionsRepository: NoteReactionsRepository,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const since = new Date(Date.now() - ps.days * 24 * 60 * 60 * 1000);

			const [totalNotes, totalReactionsReceived, followersCount] = await Promise.all([
				this.notesRepository.countBy({ userId: me.id }),
				this.noteReactionsRepository.createQueryBuilder('r')
					.innerJoin('r.note', 'note')
					.where('note.userId = :uid', { uid: me.id })
					.getCount(),
				this.followingsRepository.countBy({ followeeId: me.id }),
			]);

			// リアクション数トップのノート（過去period日）
			const sinceId = this.idService.gen(since.getTime());
			const topNotesRaw = await this.noteReactionsRepository.createQueryBuilder('r')
				.select('r.noteId', 'noteId')
				.addSelect('COUNT(*)', 'cnt')
				.innerJoin('r.note', 'note')
				.where('note.userId = :uid', { uid: me.id })
				.andWhere('note.id > :sinceId', { sinceId })
				.groupBy('r.noteId')
				.orderBy('cnt', 'DESC')
				.limit(10)
				.getRawMany();

			const topNoteDetails = await Promise.all(topNotesRaw.map(async r => {
				const note = await this.notesRepository.findOne({
					where: { id: r.noteId },
					select: { id: true, text: true, visibility: true },
				});
				if (!note) return null;
				return {
					id: note.id,
					createdAt: this.idService.parse(note.id).date.toISOString(),
					text: note.text,
					visibility: note.visibility,
					reactions: parseInt(r.cnt, 10),
				};
			})).then(rs => rs.filter(r => r != null));

			// 日別ノート投稿数
			const dailyRaw = await this.notesRepository.createQueryBuilder('note')
				.select("DATE_TRUNC('day', note.createdAt)", 'day')
				.addSelect('COUNT(*)', 'count')
				.where('note.userId = :uid', { uid: me.id })
				.andWhere('note.createdAt >= :since', { since })
				.groupBy("DATE_TRUNC('day', note.createdAt)")
				.orderBy('day', 'ASC')
				.getRawMany();

			const dailyNotes = dailyRaw.map(r => ({
				date: new Date(r.day).toISOString().slice(0, 10),
				count: parseInt(r.count, 10),
			}));

			// フォロワー増加履歴（週別）
			const followerRaw = await this.followingsRepository.createQueryBuilder('f')
				.select("DATE_TRUNC('week', f.createdAt)", 'week')
				.addSelect('COUNT(*)', 'count')
				.where('f.followeeId = :uid', { uid: me.id })
				.andWhere('f.createdAt >= :since', { since })
				.groupBy("DATE_TRUNC('week', f.createdAt)")
				.orderBy('week', 'ASC')
				.getRawMany();

			const followerHistory = followerRaw.map(r => ({
				week: new Date(r.week).toISOString().slice(0, 10),
				gained: parseInt(r.count, 10),
			}));

			return {
				totalNotes,
				totalReactionsReceived,
				followersCount,
				topNotes: topNoteDetails,
				dailyNotes,
				followerHistory,
			};
		});
	}
}
