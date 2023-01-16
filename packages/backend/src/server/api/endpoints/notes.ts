import { Inject, Injectable } from '@nestjs/common';
import type { NotesRepository } from '@/models/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueryService } from '@/core/QueryService.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['notes'],

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
		local: { type: 'boolean', default: false },
		reply: { type: 'boolean' },
		renote: { type: 'boolean' },
		withFiles: { type: 'boolean' },
		poll: { type: 'boolean' },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
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
			const query = this.queryService.makePaginationQuery(this.notesRepository.createQueryBuilder('note'), ps.sinceId, ps.untilId)
				.andWhere('note.visibility = \'public\'')
				.andWhere('note.localOnly = FALSE')
				.innerJoinAndSelect('note.user', 'user')
				.leftJoinAndSelect('user.avatar', 'avatar')
				.leftJoinAndSelect('user.banner', 'banner')
				.leftJoinAndSelect('note.reply', 'reply')
				.leftJoinAndSelect('note.renote', 'renote')
				.leftJoinAndSelect('reply.user', 'replyUser')
				.leftJoinAndSelect('replyUser.avatar', 'replyUserAvatar')
				.leftJoinAndSelect('replyUser.banner', 'replyUserBanner')
				.leftJoinAndSelect('renote.user', 'renoteUser')
				.leftJoinAndSelect('renoteUser.avatar', 'renoteUserAvatar')
				.leftJoinAndSelect('renoteUser.banner', 'renoteUserBanner');
		
			if (ps.local) {
				query.andWhere('note.userHost IS NULL');
			}
		
			if (ps.reply !== undefined) {
				query.andWhere(ps.reply ? 'note.replyId IS NOT NULL' : 'note.replyId IS NULL');
			}
		
			if (ps.renote !== undefined) {
				query.andWhere(ps.renote ? 'note.renoteId IS NOT NULL' : 'note.renoteId IS NULL');
			}
		
			if (ps.withFiles !== undefined) {
				query.andWhere(ps.withFiles ? 'note.fileIds != \'{}\'' : 'note.fileIds = \'{}\'');
			}
		
			if (ps.poll !== undefined) {
				query.andWhere(ps.poll ? 'note.hasPoll = TRUE' : 'note.hasPoll = FALSE');
			}
		
			// TODO
			//if (bot != undefined) {
			//	query.isBot = bot;
			//}
		
			const notes = await query.take(ps.limit).getMany();
		
			return await this.noteEntityService.packMany(notes);
		});
	}
}
