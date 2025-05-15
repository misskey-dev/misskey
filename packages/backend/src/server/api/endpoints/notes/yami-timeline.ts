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
		showYamiNonFollowingPublicNotes: { type: 'boolean', default: true }, // フォローしていないユーザーのパブリックやみノート表示
		showYamiFollowingNotes: { type: 'boolean', default: true }, // フォローしているユーザーのやみノート表示
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
			const redisTimelines = [];

			// やみモードONの場合のみRedisタイムラインを設定
			if (me.isInYamiMode) {
				// フォローしているユーザーのやみノート
				if (ps.showYamiFollowingNotes) {
					redisTimelines.push(`yamiTimeline:${me.id}`);
					if (ps.withFiles) {
						redisTimelines.push(`yamiTimelineWithFiles:${me.id}`);
					}
				}

				// 非フォローユーザーのパブリックノート
				if (ps.showYamiNonFollowingPublicNotes) {
					redisTimelines.push('yamiPublicNotes');
					if (ps.withFiles) {
						redisTimelines.push('yamiPublicNotesWithFiles');
					}
				}
			}

			// DBフォールバック強制フラグを設定
			const forceDbFallback = ps.showYamiNonFollowingPublicNotes && !ps.showYamiFollowingNotes;

			// 特殊なsinceIdを生成（約3ヶ月前）- ただしフロントエンドから明示的にsinceIdが指定された場合は使用しない
			const forcedSinceId = (forceDbFallback && !ps.sinceId && !ps.sinceDate)
				? this.idService.gen(Date.now() - 90 * 24 * 60 * 60 * 1000)
				: null;

			return await this.fanoutTimelineEndpointService.timeline({
				untilId: ps.untilId ?? (ps.untilDate ? this.idService.gen(ps.untilDate!) : null),
				sinceId: ps.sinceId ?? (ps.sinceDate ? this.idService.gen(ps.sinceDate!) : forcedSinceId),
				limit: ps.limit,
				allowPartial: false, // 必ず完全な結果を使用
				me,
				useDbFallback: true, // DBフォールバックを常に有効化
				redisTimelines: redisTimelines,
				noteFilter: note => {
					// クライアントサイドでの追加フィルタリング (Redis結果用)
					if (!note.isNoteInYamiMode) return false;

					// 投稿が自分のものかどうか判定
					const isMyNote = note.userId === me.id;

					// 自分がやみモードでない場合は自分の投稿だけ表示
					if (!me.isInYamiMode) {
						return isMyNote;
					}

					// 自分の投稿は常に表示
					if (isMyNote) return true;

					// ダイレクト投稿で自分が含まれていれば表示
					if (note.visibility === 'specified' && note.visibleUserIds.includes(me.id)) return true;

					// フォロー状態を確認 - この行を追加
					const isFollowing = this.userFollowingService.isFollowing(me.id, note.userId);

					// フォローしていないユーザーのパブリック投稿
					if (!isFollowing && note.visibility === 'public') {
						return ps.showYamiNonFollowingPublicNotes;
					}

					// フォローしているユーザーの投稿
					if (isFollowing) {
						return ps.showYamiFollowingNotes;
					}

					return false;
				},
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
							// 条件1: 自分の投稿は常に表示
							qb.where('note.userId = :meId', { meId: me.id });

							// 条件2: フォロー中のユーザーの投稿 (showYamiFollowingNotes が true の場合のみ)
							if (followingIds.length > 0 && ps.showYamiFollowingNotes) {
								qb.orWhere(new Brackets(qb2 => {
									// フォローしているユーザーのノート（可視性に応じて制限）
									qb2.where(new Brackets(qb3 => {
										// パブリック投稿
										qb3.where('note.userId IN (:...followingIds) AND note.visibility = :public',
											{ followingIds, public: 'public' });

										// フォロワー限定投稿
										qb3.orWhere('note.userId IN (:...followingIds) AND note.visibility = :followers',
											{ followingIds, followers: 'followers' });

										// ホーム投稿
										qb3.orWhere('note.userId IN (:...followingIds) AND note.visibility = :home',
											{ followingIds, home: 'home' });
									}));
								}));
							}

							// ダイレクト投稿 (常に表示)
							qb.orWhere(new Brackets(qb2 => {
								qb2.where('note.visibility = :specified', { specified: 'specified' })
									.andWhere(':meId = ANY(note."visibleUserIds")', { meId: me.id });
							}));

							// 条件3: パブリックやみノート - showYamiNonFollowingPublicNotes が true の場合のみ
							if (ps.showYamiNonFollowingPublicNotes) {
								qb.orWhere(new Brackets(qb3 => {
									// パブリック投稿の基本条件
									qb3.where('note.visibility = :public', { public: 'public' });

									// localOnlyパラメータがtrueの場合のみローカルに限定
									if (ps.localOnly) {
										qb3.andWhere('note.userHost IS NULL');
									}
									// ここでは userHost の条件を付けない（リモートユーザーのノートも表示するため）

									// フォローしているユーザーのノートは条件2で既に処理されているため除外
									if (followingIds.length > 0) {
										qb3.andWhere('note.userId NOT IN (:...followingIds)', { followingIds });
									} else {
										// フォローがない場合は自分自身のIDのみ除外
										qb3.andWhere('note.userId != :meId', { meId: me.id });
									}
								}));
							}
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
