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
			ref: 'Note',
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
	},
	required: [],
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
			scheduleNotes.forEach((item: any) => {
				item.note.user = user;
				item.note.createdAt = new Date(item.expiresAt);
				item.note.isSchedule = true;
				item.note.id = item.id;
			});
			return scheduleNotes;
		});
	}
}
