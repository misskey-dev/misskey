/*
 * SPDX-FileCopyrightText: hitalin and yamisskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Brackets } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import type { NotesRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueryService } from '@/core/QueryService.js';
import { DI } from '@/di-symbols.js';
import { RoleService } from '@/core/RoleService.js';
import { IdService } from '@/core/IdService.js';
import { CacheService } from '@/core/CacheService.js';
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

		private cacheService: CacheService,
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

			// メンタルヘルス保護: やみモード OFF の場合は fanout/dbFallback を経由せず即空返し
			if (!me.isInYamiMode) return [];

			// フォロー情報は noteFilter / dbFallback 双方で使うのでここで一度だけ取得
			const followings = await this.cacheService.userFollowingsCache.fetch(me.id);

			const redisTimelines: FanoutTimelineName[] = [];

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

			return await this.fanoutTimelineEndpointService.timeline({
				untilId: ps.untilId ?? (ps.untilDate ? this.idService.gen(ps.untilDate!) : null),
				sinceId: ps.sinceId ?? (ps.sinceDate ? this.idService.gen(ps.sinceDate!) : null),
				limit: ps.limit,
				allowPartial: ps.allowPartial,
				me,
				useDbFallback: true, // DBフォールバックを常に有効化
				redisTimelines: redisTimelines,
				noteFilter: (note) => {
					// やみノート以外は除外
					if (!note.isNoteInYamiMode) return false;

					// ボットフィルタリング
					if (ps.excludeBots && note.user?.isBot) return false;

					// 自分の投稿は常に表示
					if (note.userId === me.id) return true;

					// ダイレクト投稿で自分が宛先なら表示
					if (note.visibility === 'specified' && note.visibleUserIds.includes(me.id)) return true;

					// フォロー中ユーザーの投稿は visibility 問わず showYamiFollowingNotes で制御
					if (Object.hasOwn(followings, note.userId)) return ps.showYamiFollowingNotes;

					// 非フォローユーザーは public のみ showYamiNonFollowingPublicNotes で制御
					if (note.visibility === 'public') return ps.showYamiNonFollowingPublicNotes;

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

					const followingIds = Object.keys(followings);

					// Yami TL 固有の「どのノートを候補にするか」選択
					// (可視性 = specified/followers の厳密判定は generateVisibilityQuery に委譲)
					query.andWhere(new Brackets(qb => {
						// 自分の投稿
						qb.where('note.userId = :meId', { meId: me.id });

						// フォロー中ユーザーの投稿 (showYamiFollowingNotes で制御)
						if (followingIds.length > 0 && ps.showYamiFollowingNotes) {
							qb.orWhere('note.userId IN (:...followingIds)', { followingIds });
						}

						// DM (visibleUserIds への包含は generateVisibilityQuery が判定)
						qb.orWhere('note.visibility = :specified', { specified: 'specified' });

						// 非フォローユーザーのパブリックやみノート (showYamiNonFollowingPublicNotes で制御)
						if (ps.showYamiNonFollowingPublicNotes) {
							qb.orWhere(new Brackets(qb2 => {
								qb2.where('note.visibility = :public', { public: 'public' });
								if (followingIds.length > 0) {
									qb2.andWhere('note.userId NOT IN (:...followingIds)', { followingIds });
								} else {
									qb2.andWhere('note.userId != :meId', { meId: me.id });
								}
							}));
						}
					}));

					if (ps.localOnly) {
						query.andWhere('note.userHost IS NULL');
					}

					this.queryService.generateVisibilityQuery(query, me);
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
