/*
 * SPDX-FileCopyrightText: anatawa12
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Brackets } from 'typeorm';
import type { NotesRepository } from '@/models/_.js';
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
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['notes'],

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
		vmimiRelayDisabled: {
			message: 'Vmimi Relay timeline has been disabled.',
			code: 'VMIMI_RELAY_DISABLED',
			id: '7f0064c3-59a0-4154-8c37-a8898c128ccc',
		},
		bothWithRepliesAndWithFiles: {
			message: 'Specifying both withReplies and withFiles is not supported',
			code: 'BOTH_WITH_REPLIES_AND_WITH_FILES',
			id: 'dd9c8400-1cb5-4eef-8a31-200c5f933793',
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

		private noteEntityService: NoteEntityService,
		private queryService: QueryService,
		private roleService: RoleService,
		private activeUsersChart: ActiveUsersChart,
		private idService: IdService,
		private vmimiRelayTimelineService: VmimiRelayTimelineService,
		private fanoutTimelineEndpointService: FanoutTimelineEndpointService,
		private metaService: MetaService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const untilId = ps.untilId ?? (ps.untilDate ? this.idService.gen(ps.untilDate!) : null);
			const sinceId = ps.sinceId ?? (ps.sinceDate ? this.idService.gen(ps.sinceDate!) : null);

			const policies = await this.roleService.getUserPolicies(me ? me.id : null);
			if (!policies.vrtlAvailable) {
				throw new ApiError(meta.errors.vmimiRelayDisabled);
			}

			if (ps.withReplies && ps.withFiles) throw new ApiError(meta.errors.bothWithRepliesAndWithFiles);

			const serverSettings = await this.metaService.fetch();

			if (!serverSettings.enableFanoutTimeline) {
				const timeline = await this.getFromDb({
					untilId,
					sinceId,
					limit: ps.limit,
					withFiles: ps.withFiles,
					withRenotes: ps.withRenotes,
					withReplies: ps.withReplies,
					withLocalOnly: ps.withLocalOnly,
				}, me);

				process.nextTick(() => {
					if (me) {
						this.activeUsersChart.read(me);
					}
				});

				return await this.noteEntityService.packMany(timeline, me);
			}

			const timeline = await this.fanoutTimelineEndpointService.timeline({
				untilId,
				sinceId,
				limit: ps.limit,
				allowPartial: ps.allowPartial,
				me,
				useDbFallback: serverSettings.enableFanoutTimelineDbFallback,
				redisTimelines:
					ps.withFiles ? ['vmimiRelayTimelineWithFiles', ...(ps.withLocalOnly ? ['localTimelineWithFiles'] as const : [])]
					: ps.withReplies ? ['vmimiRelayTimeline', 'vmimiRelayTimelineWithReplies', ...(ps.withLocalOnly ? ['localTimeline', 'localTimelineWithReplies'] as const : [])]
					: me ? ['vmimiRelayTimeline', `vmimiRelayTimelineWithReplyTo:${me.id}`, ...(ps.withLocalOnly ? ['localTimeline', `localTimelineWithReplyTo:${me.id}`] as const : [])]
					: ['vmimiRelayTimeline', ...(ps.withLocalOnly ? ['localTimeline'] as const : [])],
				alwaysIncludeMyNotes: true,
				excludePureRenotes: !ps.withRenotes,
				dbFallback: async (untilId, sinceId, limit) => await this.getFromDb({
					untilId,
					sinceId,
					limit,
					withFiles: ps.withFiles,
					withRenotes: ps.withRenotes,
					withReplies: ps.withReplies,
					withLocalOnly: ps.withLocalOnly,
				}, me),
			});

			process.nextTick(() => {
				if (me) {
					this.activeUsersChart.read(me);
				}
			});

			return timeline;
		});
	}

	private async getFromDb(ps: {
		sinceId: string | null,
		untilId: string | null,
		limit: number,
		withFiles: boolean,
		withRenotes: boolean,
		withReplies: boolean,
		withLocalOnly: boolean,
	}, me: MiLocalUser | null) {
		//#region Construct query
		const query = this.queryService.makePaginationQuery(this.notesRepository.createQueryBuilder('note'), ps.sinceId, ps.untilId)
			.andWhere('note.visibility = \'public\'')
			.andWhere('note.channelId IS NULL')
			.innerJoinAndSelect('note.user', 'user')
			.leftJoinAndSelect('note.reply', 'reply')
			.leftJoinAndSelect('note.renote', 'renote')
			.leftJoinAndSelect('reply.user', 'replyUser')
			.leftJoinAndSelect('renote.user', 'renoteUser');

		const vmimiRelayInstances = this.vmimiRelayTimelineService.hostNames;
		query.andWhere(new Brackets(qb => {
			qb.where('note.userHost IS NULL');
			if (vmimiRelayInstances.length !== 0) {
				qb.orWhere('note.userHost IN (:...vmimiRelayInstances)', { vmimiRelayInstances });
			}
		}));

		if (!ps.withLocalOnly) {
			query.andWhere('note.localOnly = FALSE');
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

		if (me) {
			this.queryService.generateMutedUserQueryForNotes(query, me);
			this.queryService.generateBlockedUserQueryForNotes(query, me);
			this.queryService.generateMutedUserRenotesQueryForNotes(query, me);
		}

		if (ps.withFiles) {
			query.andWhere('note.fileIds != \'{}\'');
		}

		if (!ps.withRenotes) {
			query.andWhere(new Brackets(qb => {
				qb.where('note.renoteId IS NULL');
				qb.orWhere(new Brackets(qb => {
					qb.where('note.text IS NOT NULL');
					qb.orWhere('note.fileIds != \'{}\'');
				}));
			}));
		}
		//#endregion

		return await query.limit(ps.limit).getMany();
	}
}
