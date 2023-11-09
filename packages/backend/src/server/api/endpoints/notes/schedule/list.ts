/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import ms from 'ms';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type { NoteScheduleRepository } from '@/models/_.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';

export const meta = {
	tags: ['notes'],

	requireCredential: true,
	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			properties: {
				id: { type: 'string', optional: false, nullable: false },
				note: {
					type: 'object',
					optional: false, nullable: false,
					properties: {
						id: { type: 'string', optional: false, nullable: false },
						text: { type: 'string', optional: false, nullable: false },
						files: { type: 'array', optional: false, nullable: false, items: { type: 'any' } },
						localOnly: { type: 'boolean', optional: false, nullable: false },
						visibility: { type: 'string', optional: false, nullable: false },
						visibleUsers: { type: 'array', optional: false, nullable: false, items: { type: 'any' } },
						reactionAcceptance: { type: 'string', optional: false, nullable: false },
						user: {
							type: 'object',
							optional: false, nullable: false,
							ref: 'User',
						},
						createdAt: { type: 'string', optional: false, nullable: false },
						isSchedule: { type: 'boolean', optional: false, nullable: false },
					},
				},
				userId: { type: 'string', optional: false, nullable: false },
				expiresAt: { type: 'string', optional: false, nullable: false },
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
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.noteScheduleRepository)
		private noteScheduleRepository: NoteScheduleRepository,
		private userEntityService: UserEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const scheduleNotes = await this.noteScheduleRepository.findBy({ userId: me.id });
			const user = await this.userEntityService.pack(me, me);
			const scheduleNotesPack: {
				id: string;
				note: {
					id: string;
					text: string;
					files: any[];
					localOnly: boolean;
					visibility: string;
					visibleUsers: any[];
					reactionAcceptance: string;
					user: any;
					createdAt: string;
					isSchedule: boolean;
				};
				userId: string;
				expiresAt: string;
			}[] = scheduleNotes.map((item: any) => {
				return {
					...item,
					note: {
						...item.note,
						user: user,
						createdAt: new Date(item.expiresAt),
						isSchedule: true,
						id: item.id,
					},
				};
			});

			return scheduleNotesPack;
		});
	}
}
