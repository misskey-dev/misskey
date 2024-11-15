/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import ms from 'ms';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type { MiNote, MiNoteSchedule, NoteScheduleRepository } from '@/models/_.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { DriveFileEntityService } from '@/core/entities/DriveFileEntityService.js';
import { QueryService } from '@/core/QueryService.js';
import { Packed } from '@/misc/json-schema.js';
import { noteVisibilities } from '@/types.js';

export const meta = {
	tags: ['notes'],

	requireCredential: true,
	kind: 'read:notes-schedule',
	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			properties: {
				id: { type: 'string', format: 'misskey:id', optional: false, nullable: false },
				note: {
					type: 'object',
					optional: false, nullable: false,
					properties: {
						createdAt: { type: 'string', optional: false, nullable: false },
						text: { type: 'string', optional: true, nullable: false },
						cw: { type: 'string', optional: true, nullable: true },
						fileIds: { type: 'array', optional: false, nullable: false, items: { type: 'string', format: 'misskey:id', optional: false, nullable: false } },
						visibility: { type: 'string', enum: ['public', 'home', 'followers', 'specified'], optional: false, nullable: false },
						visibleUsers: {
							type: 'array', optional: false, nullable: false, items: {
								type: 'object',
								optional: false, nullable: false,
								ref: 'UserLite',
							},
						},
						user: {
							type: 'object',
							optional: false, nullable: false,
							ref: 'User',
						},
						reactionAcceptance: { type: 'string', nullable: true, enum: [null, 'likeOnly', 'likeOnlyForRemote', 'nonSensitiveOnly', 'nonSensitiveOnlyForLocalLikeOnlyForRemote'], default: null },
						isSchedule: { type: 'boolean', optional: false, nullable: false },
					},
				},
				userId: { type: 'string', optional: false, nullable: false },
				scheduledAt: { type: 'string', optional: false, nullable: false },
			},
		},
	},
	limit: {
		duration: ms('1hour'),
		max: 300,
	},

	errors: {
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
	},
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.noteScheduleRepository)
		private noteScheduleRepository: NoteScheduleRepository,

		private userEntityService: UserEntityService,
		private driveFileEntityService: DriveFileEntityService,
		private queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.noteScheduleRepository.createQueryBuilder('note'), ps.sinceId, ps.untilId)
				.andWhere('note.userId = :userId', { userId: me.id });
			const scheduleNotes = await query.limit(ps.limit).getMany();
			const user = await this.userEntityService.pack(me, me);
			const scheduleNotesPack: {
				id: string;
				note: {
					text?: string;
					cw?: string|null;
					fileIds: string[];
					visibility: typeof noteVisibilities[number];
					visibleUsers: Packed<'UserLite'>[];
					reactionAcceptance: MiNote['reactionAcceptance'];
					user: Packed<'User'>;
					createdAt: string;
					isSchedule: boolean;
				};
				userId: string;
				scheduledAt: string;
			}[] = await Promise.all(scheduleNotes.map(async (item: MiNoteSchedule) => {
				return {
					...item,
					scheduledAt: item.scheduledAt.toISOString(),
					note: {
						...item.note,
						text: item.note.text ?? '',
						user: user,
						visibility: item.note.visibility ?? 'public',
						reactionAcceptance: item.note.reactionAcceptance ?? null,
						visibleUsers: item.note.visibleUsers ? await userEntityService.packMany(item.note.visibleUsers.map(u => u.id), me) : [],
						fileIds: item.note.files ? item.note.files : [],
						files: await this.driveFileEntityService.packManyByIds(item.note.files),
						createdAt: item.scheduledAt.toISOString(),
						isSchedule: true,
						id: item.id,
					},
				};
			}));

			return scheduleNotesPack;
		});
	}
}
