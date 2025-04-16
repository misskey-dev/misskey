/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
// ホームタイムラインとfeaturedから持ってくる
// UntilIDが3日より前だった場合はもうfeauturedから取得しない（feauturedがそれより前のデータを持っていないため）
// ホームライムラインからの結果が最小のID（最古のノートになるように返す）ページネーションが壊れる+ホームタイムラインの結果に抜け漏れが発生するため
// feauturedに抜け漏れが出るのはTODO
// featuredのミュートとブロックを確認→2つの結果を比べる→feauturedをホームタイムラインの結果より新しくなるようにトリム→2つの結果を一意にしつつlimitでトリム→id順にソートしてreturn

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

			// 最もシンプルな実装 - DBから直接フィルタして取得
			const query = this.queryService.makePaginationQuery(this.notesRepository.createQueryBuilder('note'),
				ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.innerJoinAndSelect('note.user', 'user')
				.leftJoinAndSelect('note.reply', 'reply')
				.leftJoinAndSelect('note.renote', 'renote')
				.leftJoinAndSelect('reply.user', 'replyUser')
				.leftJoinAndSelect('renote.user', 'renoteUser')
				.andWhere('note.isNoteInYamiMode = TRUE'); // やみモード投稿のみ

			// フォロー中のユーザーに限定
			const followings = await this.followingsRepository.find({
				where: { followerId: me.id },
				select: ['followeeId'],
			});

			const followingIds = followings.map(x => x.followeeId);
			query.andWhere(new Brackets(qb => {
				qb.where('note.userId = :meId', { meId: me.id });
				if (followingIds.length > 0) {
					qb.orWhere('note.userId IN (:...followingIds)', { followingIds });
				}
			}));

			// 他のフィルター条件を追加
			if (ps.withFiles) {
				query.andWhere('note.fileIds != \'{}\'');
			}

			if (ps.withRenotes === false) {
				query.andWhere('note.renoteId IS NULL');
			}

			const notes = await query.limit(ps.limit).getMany();

			return await this.noteEntityService.packMany(notes, me);
		});
	}
}
