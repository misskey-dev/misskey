/*
 * SPDX-FileCopyrightText: hitalin and yamisskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Brackets } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import type { NotesRepository, FollowingsRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueryService } from '@/core/QueryService.js';
import { DI } from '@/di-symbols.js';
import { RoleService } from '@/core/RoleService.js';
import { IdService } from '@/core/IdService.js';
import { FanoutTimelineEndpointService } from '@/core/FanoutTimelineEndpointService.js';
import { FanoutTimelineName } from '@/core/FanoutTimelineService.js';
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
		excludeBots: { type: 'boolean', default: false },
		showYamiNonFollowingPublicNotes: { type: 'boolean', default: true }, // フォロー外ユーザーのパブリックやみノート表示
		showYamiFollowingNotes: { type: 'boolean', default: true }, // フォローしているユーザーのやみノート表示
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		private roleService: RoleService,
		private idService: IdService,
		private fanoutTimelineEndpointService: FanoutTimelineEndpointService,
		private queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// ポリシーチェック
			const policies = await this.roleService.getUserPolicies(me.id);
			if (!policies.yamiTlAvailable) {
				throw new ApiError(meta.errors.YamiTlDisabled);
			}

			// Redis Timelinesを使用した実装
			const redisTimelines: FanoutTimelineName[] = [];

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

			return await this.fanoutTimelineEndpointService.timeline({
				untilId: ps.untilId ?? (ps.untilDate ? this.idService.gen(ps.untilDate!) : null),
				sinceId: ps.sinceId ?? (ps.sinceDate ? this.idService.gen(ps.sinceDate!) : null),
				limit: ps.limit,
				allowPartial: false, // 必ず完全な結果を使用
				me,
				useDbFallback: true, // DBフォールバックを常に有効化
				redisTimelines: redisTimelines,
				noteFilter: (note) => {
					// やみノート以外は除外
					if (!note.isNoteInYamiMode) return false;

					// メンタルヘルス保護: やみモードOFFの場合はすべて非表示
					if (!me.isInYamiMode) return false;

					// ボットフィルタリング
					if (ps.excludeBots && note.user?.isBot) return false;

					// 自分の投稿は常に表示
					if (note.userId === me.id) return true;

					// ダイレクト投稿で自分が宛先なら表示
					if (note.visibility === 'specified' && note.visibleUserIds.includes(me.id)) return true;

					// パブリック投稿 → showYamiNonFollowingPublicNotes で制御
					if (note.visibility === 'public') return ps.showYamiNonFollowingPublicNotes;

					// その他(home/followers) → showYamiFollowingNotes で制御
					return ps.showYamiFollowingNotes;
				},
				excludePureRenotes: !ps.withRenotes,
				localOnly: ps.localOnly,
				dbFallback: async (untilId, sinceId, limit) => {
					// メンタルヘルス保護: やみモードOFFの場合は空の結果を返す
					if (!me.isInYamiMode) {
						return [];
					}

					const query = this.queryService.makePaginationQuery(this.notesRepository.createQueryBuilder('note'),
						sinceId, untilId)
						.innerJoinAndSelect('note.user', 'user')
						.leftJoinAndSelect('note.reply', 'reply')
						.leftJoinAndSelect('note.renote', 'renote')
						.leftJoinAndSelect('reply.user', 'replyUser')
						.leftJoinAndSelect('renote.user', 'renoteUser')
						.andWhere('note.isNoteInYamiMode = TRUE');

					// フォロー情報を取得
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
									// localOnlyパラメータがtrueの場合は追加の条件を設定
									const baseCondition = ps.localOnly
										? 'note.userId IN (:...followingIds) AND note.visibility = :public AND note.userHost IS NULL'
										: 'note.userId IN (:...followingIds) AND note.visibility = :public';

									// パブリック投稿
									qb3.where(baseCondition, { followingIds, public: 'public' });

									// フォロワー限定投稿 (ローカルユーザーのみで絞る場合)
									if (ps.localOnly) {
										qb3.orWhere('note.userId IN (:...followingIds) AND note.visibility = :followers AND note.userHost IS NULL',
											{ followingIds, followers: 'followers' });
									} else {
										qb3.orWhere('note.userId IN (:...followingIds) AND note.visibility = :followers',
											{ followingIds, followers: 'followers' });
									}

									// ホーム投稿 (ローカルユーザーのみで絞る場合)
									if (ps.localOnly) {
										qb3.orWhere('note.userId IN (:...followingIds) AND note.visibility = :home AND note.userHost IS NULL',
											{ followingIds, home: 'home' });
									} else {
										qb3.orWhere('note.userId IN (:...followingIds) AND note.visibility = :home',
											{ followingIds, home: 'home' });
									}
								}));
							}));
						}

						// ダイレクト投稿 (localOnly が true の場合はローカルユーザーからのみに制限)
						qb.orWhere(new Brackets(qb2 => {
							qb2.where('note.visibility = :specified', { specified: 'specified' })
								.andWhere(':meId = ANY(note."visibleUserIds")', { meId: me.id });

							// localOnlyパラメータがtrueの場合のみローカルに限定
							if (ps.localOnly) {
								qb2.andWhere('note.userHost IS NULL');
							}
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

					this.queryService.generateBaseNoteFilteringQuery(query, me);
					this.queryService.generateMutedUserRenotesQueryForNotes(query, me);

					// 他のフィルター条件を追加
					if (ps.withFiles) {
						query.andWhere('note.fileIds != \'{}\'');
					}

					if (ps.withRenotes === false) {
						query.andWhere('note.renoteId IS NULL');
					}

					if (ps.excludeBots) {
						query.andWhere('user.isBot = FALSE');
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
