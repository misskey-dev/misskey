import { Brackets } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import read from '@/services/note/read.js';
import type { Notes } from '@/models/index.js';
import { Followings } from '@/models/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueryService } from '@/services/QueryService.js';

export const meta = {
	tags: ['notes'],

	requireCredential: true,

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
		following: { type: 'boolean', default: false },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		visibility: { type: 'string' },
	},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject('notesRepository')
		private notesRepository: typeof Notes,

		private queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const followingQuery = this.followingsRepository.createQueryBuilder('following')
				.select('following.followeeId')
				.where('following.followerId = :followerId', { followerId: me.id });

			const query = this.queryService.makePaginationQuery(this.notesRepository.createQueryBuilder('note'), ps.sinceId, ps.untilId)
				.andWhere(new Brackets(qb => { qb
					.where(`'{"${me.id}"}' <@ note.mentions`)
					.orWhere(`'{"${me.id}"}' <@ note.visibleUserIds`);
				}))
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
			this.queryService.generateMutedUserQuery(query, me);
			this.queryService.generateMutedNoteThreadQuery(query, me);
			this.queryService.generateBlockedUserQuery(query, me);

			if (ps.visibility) {
				query.andWhere('note.visibility = :visibility', { visibility: ps.visibility });
			}

			if (ps.following) {
				query.andWhere(`((note.userId IN (${ followingQuery.getQuery() })) OR (note.userId = :meId))`, { meId: me.id });
				query.setParameters(followingQuery.getParameters());
			}

			const mentions = await query.take(ps.limit).getMany();

			read(me.id, mentions);

			return await this.notesRepository.packMany(mentions, me);
		});
	}
}
