import { Inject, Injectable } from '@nestjs/common';
import type { NotesRepository } from '@/models/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueryService } from '@/core/QueryService.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['notes'],

	requireCredential: false,
	allowGet: true,
	cacheSec: 3600,

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'Note',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		offset: { type: 'integer', default: 0 },
		channelId: { type: 'string', nullable: true, format: 'misskey:id' },
	},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private noteEntityService: NoteEntityService,
		private queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const day = 1000 * 60 * 60 * 24 * 3; // 3日前まで

			const query = this.notesRepository.createQueryBuilder('note')
				.addSelect('note.score')
				.where('note.userHost IS NULL')
				.andWhere('note.score > 0')
				.andWhere('note.createdAt > :date', { date: new Date(Date.now() - day) })
				.andWhere('note.visibility = \'public\'')
				.innerJoinAndSelect('note.user', 'user')
				.leftJoinAndSelect('note.reply', 'reply')
				.leftJoinAndSelect('note.renote', 'renote')
				.leftJoinAndSelect('reply.user', 'replyUser')
				.leftJoinAndSelect('renote.user', 'renoteUser');

			if (ps.channelId) query.andWhere('note.channelId = :channelId', { channelId: ps.channelId });

			if (me) this.queryService.generateMutedUserQuery(query, me);
			if (me) this.queryService.generateBlockedUserQuery(query, me);

			let notes = await query
				.orderBy('note.score', 'DESC')
				.take(100)
				.getMany();

			notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

			notes = notes.slice(ps.offset, ps.offset + ps.limit);

			return await this.noteEntityService.packMany(notes, me);
		});
	}
}
