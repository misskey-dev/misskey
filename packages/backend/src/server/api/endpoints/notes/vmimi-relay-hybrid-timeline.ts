/*
 * SPDX-FileCopyrightText: anatawa12
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Brackets } from 'typeorm';
import type { ChannelFollowingsRepository, NotesRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueryService } from '@/core/QueryService.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import ActiveUsersChart from '@/core/chart/charts/active-users.js';
import { DI } from '@/di-symbols.js';
import { RoleService } from '@/core/RoleService.js';
import { VmimiRelayTimelineService } from '@/core/VmimiRelayTimelineService.js';
import { FanoutTimelineEndpointService } from '@/core/FanoutTimelineEndpointService.js';
import { MiLocalUser } from '@/models/User.js';
import { MetaService } from '@/core/MetaService.js';
import { IdService } from '@/core/IdService.js';
import { UserFollowingService } from '@/core/UserFollowingService.js';
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
		vmimiRelaySocialDisabled: {
			message: 'Vmimi Relay Hybrid timeline has been disabled.',
			code: 'VMIMI_RELAY_DISABLED',
			id: 'e7496627-8086-4294-b488-63323eb80145',
		},
		bothWithRepliesAndWithFiles: {
			message: 'Specifying both withReplies and withFiles is not supported',
			code: 'BOTH_WITH_REPLIES_AND_WITH_FILES',
			id: '8222638e-a5a9-495d-ae72-e825793e0a63',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		withFiles: { type: 'boolean', default: false },
		withRenotes: { type: 'boolean', default: true },
		withReplies: { type: 'boolean', default: false },
		withLocalOnly: { type: 'boolean', default: true },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		allowPartial: { type: 'boolean', default: true }, // this timeline is new so true by default
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		sinceDate: { type: 'integer' },
		untilDate: { type: 'integer' },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.channelFollowingsRepository)
		private channelFollowingsRepository: ChannelFollowingsRepository,

		private noteEntityService: NoteEntityService,
		private queryService: QueryService,
		private roleService: RoleService,
		private activeUsersChart: ActiveUsersChart,
		private idService: IdService,
		private vmimiRelayTimelineService: VmimiRelayTimelineService,
		private userFollowingService: UserFollowingService,
		private fanoutTimelineEndpointService: FanoutTimelineEndpointService,
		private metaService: MetaService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const untilId = ps.untilId ?? (ps.untilDate ? this.idService.gen(ps.untilDate!) : null);
			const sinceId = ps.sinceId ?? (ps.sinceDate ? this.idService.gen(ps.sinceDate!) : null);

			const policies = await this.roleService.getUserPolicies(me.id);
			if (!policies.vrtlAvailable) {
				throw new ApiError(meta.errors.vmimiRelaySocialDisabled);
			}

			if (ps.withReplies && ps.withFiles) throw new ApiError(meta.errors.bothWithRepliesAndWithFiles);

			const serverSettings = await this.metaService.fetch();

			if (!serverSettings.enableFanoutTimeline) {
				const timeline = await this.getFromDb({
					untilId,
					sinceId,
					limit: ps.limit,
					withFiles: ps.withFiles,
					withReplies: ps.withReplies,
					withLocalOnly: ps.withLocalOnly,
				}, me);

				process.nextTick(() => {
					this.activeUsersChart.read(me);
				});

				return await this.noteEntityService.packMany(timeline, me);
			}

			let timelineConfig: FanoutTimelineName[];

			if (ps.withFiles) {
				timelineConfig = [
					`homeTimelineWithFiles:${me.id}`,
					'vmimiRelayTimelineWithFiles',
				];
				if (ps.withLocalOnly) timelineConfig = [...timelineConfig, 'localTimelineWithFiles'];
			} else if (ps.withReplies) {
				timelineConfig = [
					`homeTimeline:${me.id}`,
					'vmimiRelayTimeline',
					'vmimiRelayTimelineWithReplies',
				];
				if (ps.withLocalOnly) timelineConfig = [...timelineConfig, 'localTimeline', 'localTimelineWithReplies'];
			} else {
				timelineConfig = [
					`homeTimeline:${me.id}`,
					'vmimiRelayTimeline',
					`vmimiRelayTimelineWithReplyTo:${me.id}`,
				];
				if (ps.withLocalOnly) timelineConfig = [...timelineConfig, 'localTimeline', `localTimelineWithReplyTo:${me.id}`];
			}

			const redisTimeline = await this.fanoutTimelineEndpointService.timeline({
				untilId,
				sinceId,
				limit: ps.limit,
				allowPartial: ps.allowPartial,
				me,
				redisTimelines: timelineConfig,
				useDbFallback: serverSettings.enableFanoutTimelineDbFallback,
				alwaysIncludeMyNotes: true,
				excludePureRenotes: !ps.withRenotes,
				dbFallback: async (untilId, sinceId, limit) => await this.getFromDb({
					untilId,
					sinceId,
					limit,
					withFiles: ps.withFiles,
					withReplies: ps.withReplies,
					withLocalOnly: ps.withLocalOnly,
				}, me),
			});

			process.nextTick(() => {
				this.activeUsersChart.read(me);
			});

			return redisTimeline;
		});
	}

	private async getFromDb(ps: {
		untilId: string | null,
		sinceId: string | null,
		limit: number,
		withFiles: boolean,
		withReplies: boolean,
		withLocalOnly: boolean,
	}, me: MiLocalUser) {
		const followees = await this.userFollowingService.getFollowees(me.id);
		const followingChannels = await this.channelFollowingsRepository.find({
			where: {
				followerId: me.id,
			},
		});
		const vmimiRelayInstances = this.vmimiRelayTimelineService.hostNames;

		const query = this.queryService.makePaginationQuery(this.notesRepository.createQueryBuilder('note'), ps.sinceId, ps.untilId)
			.andWhere(new Brackets(qb => {
				if (followees.length > 0) {
					const meOrFolloweeIds = [me.id, ...followees.map(f => f.followeeId)];
					qb.where('note.userId IN (:...meOrFolloweeIds)', { meOrFolloweeIds: meOrFolloweeIds });
					qb.orWhere(new Brackets(qb => {
						qb.where('note.visibility = \'public\'');
						if (!ps.withLocalOnly) qb.andWhere('note.localOnly = FALSE');
						qb.andWhere(new Brackets(qb => {
							qb.where('note.userHost IS NULL');
							if (vmimiRelayInstances.length !== 0) {
								qb.orWhere('note.userHost IN (:...vmimiRelayInstances)', { vmimiRelayInstances });
							}
						}));
					}));
				} else {
					qb.where('note.userId = :meId', { meId: me.id });
					qb.orWhere(new Brackets(qb => {
						qb.where('note.visibility = \'public\'');
						if (!ps.withLocalOnly) qb.andWhere('note.localOnly = FALSE');
						qb.andWhere(new Brackets(qb => {
							qb.where('note.userHost IS NULL');
							if (vmimiRelayInstances.length !== 0) {
								qb.orWhere('note.userHost IN (:...vmimiRelayInstances)', { vmimiRelayInstances });
							}
						}));
					}));
				}
			}))
			.innerJoinAndSelect('note.user', 'user')
			.leftJoinAndSelect('note.reply', 'reply')
			.leftJoinAndSelect('note.renote', 'renote')
			.leftJoinAndSelect('reply.user', 'replyUser')
			.leftJoinAndSelect('renote.user', 'renoteUser');

		if (followingChannels.length > 0) {
			const followingChannelIds = followingChannels.map(x => x.followeeId);

			query.andWhere(new Brackets(qb => {
				qb.where('note.channelId IN (:...followingChannelIds)', { followingChannelIds });
				qb.orWhere('note.channelId IS NULL');
			}));
		} else {
			query.andWhere('note.channelId IS NULL');
		}

		if (!ps.withReplies) {
			query.andWhere(new Brackets(qb => {
				qb
					.where('note.replyId IS NULL') // 返信ではない
					.orWhere(new Brackets(qb => {
						qb // 返信だけど投稿者自身への返信
							.where('note.replyId IS NOT NULL')
							.andWhere('note.replyUserId = note.userId');
					}));
			}));
		}

		this.queryService.generateVisibilityQuery(query, me);
		this.queryService.generateMutedUserQueryForNotes(query, me);
		this.queryService.generateBlockedUserQueryForNotes(query, me);
		this.queryService.generateMutedUserRenotesQueryForNotes(query, me);

		if (ps.withFiles) {
			query.andWhere('note.fileIds != \'{}\'');
		}
		//#endregion

		return await query.limit(ps.limit).getMany();
	}
}
