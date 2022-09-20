import { In } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import type { NotesRepository } from '@/models/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueryService } from '@/core/QueryService.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import type { Config } from '@/config.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['notes'],

	requireCredential: false,

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'Note',
		},
	},

	errors: {
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		query: { type: 'string' },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		offset: { type: 'integer', default: 0 },
		host: {
			type: 'string',
			nullable: true,
			description: 'The local host is represented with `null`.',
		},
		userId: { type: 'string', format: 'misskey:id', nullable: true, default: null },
		channelId: { type: 'string', format: 'misskey:id', nullable: true, default: null },
	},
	required: ['query'],
} as const;

// TODO: ロジックをサービスに切り出す

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.config)
		private config: Config,
	
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private noteEntityService: NoteEntityService,
		private queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.notesRepository.createQueryBuilder('note'), ps.sinceId, ps.untilId);

			if (ps.userId) {
				query.andWhere('note.userId = :userId', { userId: ps.userId });
			} else if (ps.channelId) {
				query.andWhere('note.channelId = :channelId', { channelId: ps.channelId });
			}

			query
				.andWhere('note.text ILIKE :q', { q: `%${ps.query}%` })
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

			this.queryService.generateVisibilityQuery(query, me);
			if (me) this.queryService.generateMutedUserQuery(query, me);
			if (me) this.queryService.generateBlockedUserQuery(query, me);

			const notes = await query.take(ps.limit).getMany();

			return await this.noteEntityService.packMany(notes, me);
		});
	}
}
