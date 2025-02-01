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
import type { NotesRepository, ChannelFollowingsRepository } from '@/models/_.js';
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
import { isInstanceMuted } from '@/misc/is-instance-muted.js';
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
		HanamiTlDisabled: {
			message: 'Hanami timeline has been disabled.',
			code: 'HanamiTL_DISABLED',
			id: 'ffa57e0f-d14e-48d6-a64c-8fbcba5635ab',
		},
		FttDisabled: {
			message: 'Fanout timeline has been disabled.',
			code: 'FTT_DISABLED',
			id: '31f4d555-f46a-cae8-8e45-9a17740748e8',
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
			const untilId = ps.untilId ?? (ps.untilDate ? this.idService.gen(ps.untilDate!) : null);
			const sinceId = ps.sinceId ?? (ps.sinceDate ? this.idService.gen(ps.sinceDate!) : null);

			const policies = await this.roleService.getUserPolicies(me ? me.id : null);
			if (!policies.hanamiTlAvailable) {
				throw new ApiError(meta.errors.HanamiTlDisabled);
			}

			const serverSettings = await this.metaService.fetch();

			if (!serverSettings.enableFanoutTimeline) {
				throw new ApiError(meta.errors.FttDisabled);
			}

			const followingsPromise = this.cacheService.userFollowingsCache.fetch(me.id);
			const [packedHomeTimelineNotes, feauturedNotes] = await Promise.all([
				(async () => {
					const followings = await followingsPromise;
					return this.fanoutTimelineEndpointService.timeline({
						untilId,
						sinceId,
						limit: ps.limit,
						allowPartial: ps.allowPartial,
						me,
						useDbFallback: serverSettings.enableFanoutTimelineDbFallback,
						redisTimelines: ps.withFiles ? [`homeTimelineWithFiles:${me.id}`] : [`homeTimeline:${me.id}`],
						alwaysIncludeMyNotes: true,
						excludePureRenotes: !ps.withRenotes,
						noteFilter: note => {
							if (note.reply && note.reply.visibility === 'followers') {
								if (!Object.hasOwn(followings, note.reply.userId) && note.reply.userId !== me.id) return false;
							}
							return true;
						},
						dbFallback: async (untilId, sinceId, limit) => await this.getFromDb({
							untilId,
							sinceId,
							limit,
							includeMyRenotes: ps.includeMyRenotes,
							includeRenotedMyNotes: ps.includeRenotedMyNotes,
							includeLocalRenotes: ps.includeLocalRenotes,
							withFiles: ps.withFiles,
							withRenotes: ps.withRenotes,
						}, me),
					});
				})(),
				this.getFeaturedNotes({
					untilId,
					sinceId,
					limit: ps.limit,
				}, me),
			]);

			if (feauturedNotes.length === 0) {
				return packedHomeTimelineNotes;
			}
			const packedFeauturedNotes = await this.noteEntityService.packMany(feauturedNotes, me);

			if (packedHomeTimelineNotes.length === 0) {
				return packedFeauturedNotes.sort((a, b) => a.id > b.id ? -1 : 1).slice(0, ps.limit); ;
			}

			// TODO 重複の考慮
			let allNotes;
			if (!ps.sinceId && !ps.untilId) {
				// フィーチャーされた投稿の上位20件をシャッフル
				const top20FeaturedNotes = packedFeauturedNotes.slice(0, 20);
				for (let i = top20FeaturedNotes.length - 1; i > 0; i--) {
					const j = Math.floor(Math.random() * (i + 1));
					[top20FeaturedNotes[i], top20FeaturedNotes[j]] = [top20FeaturedNotes[j], top20FeaturedNotes[i]];
				}

				const [
					featuredTop,
					remainingFeaturedNotes,
					homeTimelineTop2,
					remainingHomeTimelineNotes,
					remainingFeaturedNotesFromFullList,
				  ] = await Promise.all([
					(async () => top20FeaturedNotes.slice(0, 4))(),
					(async () => top20FeaturedNotes.slice(4))(),
					(async () => packedHomeTimelineNotes.slice(0, 2))(),
					(async () => packedHomeTimelineNotes.slice(2))(),
					(async () => packedFeauturedNotes.slice(20))(),
				]);

				const mixedTop = [...homeTimelineTop2, ...featuredTop];

				const remainingNotes = [
					...remainingFeaturedNotes,
					...remainingHomeTimelineNotes,
					...remainingFeaturedNotesFromFullList,
				].sort((a, b) => a.id > b.id ? -1 : 1);

				allNotes = [...mixedTop, ...remainingNotes];
			} else {
				allNotes = [...packedHomeTimelineNotes, ...packedFeauturedNotes].sort((a, b) => a.id > b.id ? -1 : 1);
			}

			// 重複を排除
			const seenIds = new Set();
			allNotes = allNotes.filter(note => {
				if (seenIds.has(note.id)) {
					return false;
				}
				seenIds.add(note.id);
				return true;
			});

			// リミットを適用(リミットはあくまで最大であってそれより少なくなってもいいため)
			const limitedNotes = allNotes.slice(0, ps.limit);
			const homeTimelineIdsSet = new Set(packedHomeTimelineNotes.map(note => note.id));

			// ホームタイムラインからのノートが存在し、かつリミット適用後の最小IDがホームタイムラインに由来しない場合
			let minNoteId: string | null = limitedNotes.length > 0 ? limitedNotes[limitedNotes.length - 1].id : null;

			if (homeTimelineIdsSet.size > 0 && limitedNotes.some(note => homeTimelineIdsSet.has(note.id))) {
				// 最小IDがホームタイムラインに由来しない場合、最小のノートを削除していく
				// これによってホームタイムラインの取得漏れが消える
				while (minNoteId && !homeTimelineIdsSet.has(minNoteId)) {
					limitedNotes.pop();
					minNoteId = limitedNotes.length > 0 ? limitedNotes[limitedNotes.length - 1].id : null;
				}
			}
			return limitedNotes;
		});
	}

	private async getFeaturedNotes(ps: { untilId: string | null; sinceId: string | null; limit: number; }, me: MiLocalUser) {
		let feauturedNoteIds: string[];
		if (this.globalNotesRankingCacheLastFetchedAt !== 0 && (Date.now() - this.globalNotesRankingCacheLastFetchedAt < 1000 * 60 * 30)) {
			feauturedNoteIds = this.globalNotesRankingCache;
		} else {
			feauturedNoteIds = await this.featuredService.getGlobalNotesRanking(100);
			this.globalNotesRankingCache = feauturedNoteIds;
			this.globalNotesRankingCacheLastFetchedAt = Date.now();
		}

		if (feauturedNoteIds.length === 0) {
			return [];
		}

		const [
			userIdsWhoMeMuting,
			userIdsWhoBlockingMe,
			userMutedInstances,
		] = await Promise.all([
			this.cacheService.userMutingsCache.fetch(me.id),
			this.cacheService.userBlockedCache.fetch(me.id),
			this.cacheService.userProfileCache.fetch(me.id).then(p => new Set(p.mutedInstances)),
		]);

		const query = this.queryService.makePaginationQuery(this.notesRepository.createQueryBuilder('note'), ps.sinceId, ps.untilId)
			.where('note.id IN (:...noteIds)', { noteIds: feauturedNoteIds })
			.innerJoinAndSelect('note.user', 'user')
			.leftJoinAndSelect('note.reply', 'reply')
			.leftJoinAndSelect('note.renote', 'renote')
			.leftJoinAndSelect('reply.user', 'replyUser')
			.leftJoinAndSelect('renote.user', 'renoteUser')
			.leftJoinAndSelect('note.channel', 'channel');

		const feauturedNotes = (await query.getMany()).filter(note => {
			if (isUserRelated(note, userIdsWhoBlockingMe)) return false;
			if (isUserRelated(note, userIdsWhoMeMuting)) return false;
			if (isInstanceMuted(note, userMutedInstances)) return false;

			return true;
		});

		return feauturedNotes;
	}

	private async getFromDb(ps: { untilId: string | null; sinceId: string | null; limit: number; includeMyRenotes: boolean; includeRenotedMyNotes: boolean; includeLocalRenotes: boolean; withFiles: boolean; withRenotes: boolean; }, me: MiLocalUser) {
		const followees = await this.userFollowingService.getFollowees(me.id);
		const followingChannels = await this.channelFollowingsRepository.find({
			where: {
				followerId: me.id,
			},
		});

		//#region Construct query
		const query = this.queryService.makePaginationQuery(this.notesRepository.createQueryBuilder('note'), ps.sinceId, ps.untilId)
			.innerJoinAndSelect('note.user', 'user')
			.leftJoinAndSelect('note.reply', 'reply')
			.leftJoinAndSelect('note.renote', 'renote')
			.leftJoinAndSelect('reply.user', 'replyUser')
			.leftJoinAndSelect('renote.user', 'renoteUser');

		if (followees.length > 0 && followingChannels.length > 0) {
			// ユーザー・チャンネルともにフォローあり
			const meOrFolloweeIds = [me.id, ...followees.map(f => f.followeeId)];
			const followingChannelIds = followingChannels.map(x => x.followeeId);
			query.andWhere(new Brackets(qb => {
				qb
					.where(new Brackets(qb2 => {
						qb2
							.where('note.userId IN (:...meOrFolloweeIds)', { meOrFolloweeIds: meOrFolloweeIds })
							.andWhere('note.channelId IS NULL');
					}))
					.orWhere('note.channelId IN (:...followingChannelIds)', { followingChannelIds });
			}));
		} else if (followees.length > 0) {
			// ユーザーフォローのみ（チャンネルフォローなし）
			const meOrFolloweeIds = [me.id, ...followees.map(f => f.followeeId)];
			query
				.andWhere('note.channelId IS NULL')
				.andWhere('note.userId IN (:...meOrFolloweeIds)', { meOrFolloweeIds: meOrFolloweeIds });
		} else if (followingChannels.length > 0) {
			// チャンネルフォローのみ（ユーザーフォローなし）
			const followingChannelIds = followingChannels.map(x => x.followeeId);
			query.andWhere(new Brackets(qb => {
				qb
					.where('note.channelId IN (:...followingChannelIds)', { followingChannelIds })
					.orWhere('note.userId = :meId', { meId: me.id });
			}));
		} else {
			// フォローなし
			query
				.andWhere('note.channelId IS NULL')
				.andWhere('note.userId = :meId', { meId: me.id });
		}

		query.andWhere(new Brackets(qb => {
			qb
				.where('note.replyId IS NULL') // 返信ではない
				.orWhere(new Brackets(qb => {
					qb // 返信だけど投稿者自身への返信
						.where('note.replyId IS NOT NULL')
						.andWhere('note.replyUserId = note.userId');
				}));
		}));

		this.queryService.generateVisibilityQuery(query, me);
		this.queryService.generateMutedUserQuery(query, me);
		this.queryService.generateBlockedUserQuery(query, me);
		this.queryService.generateMutedUserRenotesQueryForNotes(query, me);

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

		if (ps.withRenotes === false) {
			query.andWhere('note.renoteId IS NULL');
		}
		//#endregion

		return await query.limit(ps.limit).getMany();
	}
}
