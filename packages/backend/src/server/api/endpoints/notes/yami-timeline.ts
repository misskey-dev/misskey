/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Brackets } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import type { NotesRepository, ChannelFollowingsRepository, FollowingsRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueryService } from '@/core/QueryService.js';
import ActiveUsersChart from '@/core/chart/charts/active-users.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { DI } from '@/di-symbols.js';
import { RoleService } from '@/core/RoleService.js';
import { IdService } from '@/core/IdService.js';
import { CacheService } from '@/core/CacheService.js';
import { UserFollowingService } from '@/core/UserFollowingService.js';
import { MiLocalUser } from '@/models/User.js';
import { MetaService } from '@/core/MetaService.js';
import { FanoutTimelineEndpointService } from '@/core/FanoutTimelineEndpointService.js';
import { FeaturedService } from '@/core/FeaturedService.js';
import { isUserRelated } from '@/misc/is-user-related.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['notes'],

	requireCredential: true,
	kind: 'read:account',

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
		YamiTlDisabled: {
			message: 'Yami timeline has been disabled.',
			code: 'YamiTL_DISABLED',
			id: 'ffa57e0f-d14e-48d6-a64c-8fbcba5635ab',
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
		allowPartial: { type: 'boolean', default: false }, // true is recommended but for compatibility false by default
		includeMyRenotes: { type: 'boolean', default: true },
		includeRenotedMyNotes: { type: 'boolean', default: true },
		includeLocalRenotes: { type: 'boolean', default: true },
		withFiles: { type: 'boolean', default: false },
		withRenotes: { type: 'boolean', default: true },
		localOnly: { type: 'boolean', default: false }, // ローカルのみフィルター
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	private globalNotesRankingCache: string[] = [];
	private globalNotesRankingCacheLastFetchedAt = 0;

	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.channelFollowingsRepository)
		private channelFollowingsRepository: ChannelFollowingsRepository,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		private noteEntityService: NoteEntityService,
		private roleService: RoleService,
		private activeUsersChart: ActiveUsersChart,
		private idService: IdService,
		private cacheService: CacheService,
		private fanoutTimelineEndpointService: FanoutTimelineEndpointService,
		private userFollowingService: UserFollowingService,
		private queryService: QueryService,
		private metaService: MetaService,
		private featuredService: FeaturedService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// ポリシーチェック
			const policies = await this.roleService.getUserPolicies(me.id);
			if (!policies.yamiTlAvailable) {
				throw new ApiError(meta.errors.YamiTlDisabled);
			}

			// Redis Timelinesを使用した実装
			const baseTimeline = `yamiTimeline:${me.id}`;
			const baseTimelineWithFiles = `yamiTimelineWithFiles:${me.id}`;
			const publicTimelines = me.isInYamiMode ? ['yamiPublicNotes'] : [];
			const publicTimelinesWithFiles = me.isInYamiMode ? ['yamiPublicNotesWithFiles'] : [];

			const redisTimelines = ps.withFiles
				? [baseTimeline, ...publicTimelines, baseTimelineWithFiles, ...publicTimelinesWithFiles]
				: [baseTimeline, ...publicTimelines];

			return await this.fanoutTimelineEndpointService.timeline({
				untilId: ps.untilId ?? (ps.untilDate ? this.idService.gen(ps.untilDate!) : null),
				sinceId: ps.sinceId ?? (ps.sinceDate ? this.idService.gen(ps.sinceDate!) : null),
				limit: ps.limit,
				allowPartial: false, // 確実にDBフォールバックも使うようにfalse
				me,
				useDbFallback: true,
				redisTimelines: redisTimelines,
				noteFilter: note => note.isNoteInYamiMode,
				excludePureRenotes: !ps.withRenotes,
				localOnly: ps.localOnly,
				dbFallback: async (untilId, sinceId, limit) => {
					const query = this.queryService.makePaginationQuery(this.notesRepository.createQueryBuilder('note'),
						sinceId, untilId)
						.innerJoinAndSelect('note.user', 'user')
						.leftJoinAndSelect('note.reply', 'reply')
						.leftJoinAndSelect('note.renote', 'renote')
						.leftJoinAndSelect('reply.user', 'replyUser')
						.leftJoinAndSelect('renote.user', 'renoteUser')
						.andWhere('note.isNoteInYamiMode = TRUE');

					// 自分がやみモードでない場合は自分の投稿だけ表示
					if (!me.isInYamiMode) {
						query.andWhere('note.userId = :meId', { meId: me.id });
					} else {
						// やみモードONの場合は通常のフィルタリング
						const followings = await this.followingsRepository.find({
							where: { followerId: me.id },
							select: ['followeeId'],
						});

						const followingIds = followings.map(x => x.followeeId);
						query.andWhere(new Brackets(qb => {
							// 条件1: 自分の投稿
							qb.where('note.userId = :meId', { meId: me.id });

							if (followingIds.length > 0) {
								// 条件2: フォロー中のユーザーの投稿
								qb.orWhere(new Brackets(qb2 => {
									// パブリック投稿のみ対応
									qb2.where('note.userId IN (:...followingIds) AND note.visibility = :public',
										{ followingIds, public: 'public' });

									// 追加すべき条件
									// フォロワー限定投稿
									qb2.orWhere('note.userId IN (:...followingIds) AND note.visibility = :followers',
										{ followingIds, followers: 'followers' });

									// ホーム投稿
									qb2.orWhere('note.userId IN (:...followingIds) AND note.visibility = :home',
										{ followingIds, home: 'home' });
								}));

								// ダイレクト投稿
								qb.orWhere(new Brackets(qb2 => {
									qb2.where('note.visibility = :specified', { specified: 'specified' })
										.andWhere(':meId = ANY(note."visibleUserIds")', { meId: me.id });
								}));
							}

							// 条件3: パブリックやみノート（ローカルのみ）- ハイブリッドTLと同様
							qb.orWhere('note.visibility = :public AND note.userHost IS NULL',
								{ public: 'public' });
						}));
					}

					// 他のフィルター条件を追加
					if (ps.withFiles) {
						query.andWhere('note.fileIds != \'{}\'');
					}

					if (ps.withRenotes === false) {
						query.andWhere('note.renoteId IS NULL');
					}

					// ソート順を明示的に指定
					query.orderBy('note.id', 'DESC');

					const notes = await query.limit(limit).getMany();
					return notes;
				},
			});
		});
	}
}
