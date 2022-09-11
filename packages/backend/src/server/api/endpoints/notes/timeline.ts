import { Brackets } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import { Notes, Followings } from '@/models/index.js';
import { activeUsersChart } from '@/services/chart/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { makePaginationQuery } from '../../common/make-pagination-query.js';
import { generateVisibilityQuery } from '../../common/generate-visibility-query.js';
import { generateMutedUserQuery } from '../../common/generate-muted-user-query.js';
import { generateRepliesQuery } from '../../common/generate-replies-query.js';
import { generateMutedNoteQuery } from '../../common/generate-muted-note-query.js';
import { generateChannelQuery } from '../../common/generate-channel-query.js';
import { generateBlockedUserQuery } from '../../common/generate-block-query.js';

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
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		sinceDate: { type: 'integer' },
		untilDate: { type: 'integer' },
		includeMyRenotes: { type: 'boolean', default: true },
		includeRenotedMyNotes: { type: 'boolean', default: true },
		includeLocalRenotes: { type: 'boolean', default: true },
		withFiles: {
			type: 'boolean',
			default: false,
			description: 'Only show notes that have attached files.',
		},
	},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
	) {
		super(meta, paramDef, async (ps, me) => {
			const hasFollowing = (await Followings.count({
				where: {
					followerId: me.id,
				},
				take: 1,
			})) !== 0;

			//#region Construct query
			const followingQuery = Followings.createQueryBuilder('following')
				.select('following.followeeId')
				.where('following.followerId = :followerId', { followerId: me.id });

			const query = makePaginationQuery(Notes.createQueryBuilder('note'),
				ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere(new Brackets(qb => { qb
					.where('note.userId = :meId', { meId: me.id });
				if (hasFollowing) qb.orWhere(`note.userId IN (${ followingQuery.getQuery() })`);
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
				.leftJoinAndSelect('renoteUser.banner', 'renoteUserBanner')
				.setParameters(followingQuery.getParameters());

			generateChannelQuery(query, me);
			generateRepliesQuery(query, me);
			generateVisibilityQuery(query, me);
			generateMutedUserQuery(query, me);
			generateMutedNoteQuery(query, me);
			generateBlockedUserQuery(query, me);

			if (ps.includeMyRenotes === false) {
				query.andWhere(new Brackets(qb => {
					qb.orWhere('note.userId != :meId', { meId: me.id });
					qb.orWhere('note.renoteId IS NULL');
					qb.orWhere('note.text IS NOT NULL');
					qb.orWhere('note.fileIds != \'{}\'');
					qb.orWhere('0 < (SELECT COUNT(*) FROM poll WHERE poll."noteId" = note.id)');
				}));
			}

			if (ps.includeRenotedMyNotes === false) {
				query.andWhere(new Brackets(qb => {
					qb.orWhere('note.renoteUserId != :meId', { meId: me.id });
					qb.orWhere('note.renoteId IS NULL');
					qb.orWhere('note.text IS NOT NULL');
					qb.orWhere('note.fileIds != \'{}\'');
					qb.orWhere('0 < (SELECT COUNT(*) FROM poll WHERE poll."noteId" = note.id)');
				}));
			}

			if (ps.includeLocalRenotes === false) {
				query.andWhere(new Brackets(qb => {
					qb.orWhere('note.renoteUserHost IS NOT NULL');
					qb.orWhere('note.renoteId IS NULL');
					qb.orWhere('note.text IS NOT NULL');
					qb.orWhere('note.fileIds != \'{}\'');
					qb.orWhere('0 < (SELECT COUNT(*) FROM poll WHERE poll."noteId" = note.id)');
				}));
			}

			if (ps.withFiles) {
				query.andWhere('note.fileIds != \'{}\'');
			}
			//#endregion

			const timeline = await query.take(ps.limit).getMany();

			process.nextTick(() => {
				activeUsersChart.read(me);
			});

			return await Notes.packMany(timeline, me);
		});
	}
}
