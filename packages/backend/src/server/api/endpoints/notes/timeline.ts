import { Brackets } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import type { NotesRepository, FollowingsRepository } from '@/models/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueryService } from '@/core/QueryService.js';
import ActiveUsersChart from '@/core/chart/charts/active-users.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { MetaService } from '@/core/MetaService.js';
import { DI } from '@/di-symbols.js';

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
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		private noteEntityService: NoteEntityService,
		private queryService: QueryService,
		private activeUsersChart: ActiveUsersChart,
	) {
		super(meta, paramDef, async (ps, me) => {
			const hasFollowing = (await this.followingsRepository.count({
				where: {
					followerId: me.id,
				},
				take: 1,
			})) !== 0;

			//#region Construct query
			const followingQuery = this.followingsRepository.createQueryBuilder('following')
				.select('following.followeeId')
				.where('following.followerId = :followerId', { followerId: me.id });

			const query = this.queryService.makePaginationQuery(this.notesRepository.createQueryBuilder('note'),
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

			this.queryService.generateChannelQuery(query, me);
			this.queryService.generateRepliesQuery(query, me);
			this.queryService.generateVisibilityQuery(query, me);
			this.queryService.generateMutedUserQuery(query, me);
			this.queryService.generateMutedNoteQuery(query, me);
			this.queryService.generateBlockedUserQuery(query, me);

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
				this.activeUsersChart.read(me);
			});

			return await this.noteEntityService.packMany(timeline, me);
		});
	}
}
