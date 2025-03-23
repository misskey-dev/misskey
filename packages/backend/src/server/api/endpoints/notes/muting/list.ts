/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { NoteMutingService } from '@/core/note/NoteMutingService.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';

export const meta = {
	tags: ['notes'],

	requireCredential: true,

	kind: 'read:account',

	res: {
		type: 'array',
		items: {
			type: 'object',
			properties: {
				id: { type: 'string' },
				expiresAt: { type: 'string', format: 'date-time', nullable: true },
				note: { type: 'object', ref: 'Note' },
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		sinceId: { type: 'string', format: 'misskey:id', nullable: true },
		untilId: { type: 'string', format: 'misskey:id', nullable: true },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		offset: { type: 'integer' },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private readonly noteMutingService: NoteMutingService,
		private readonly noteEntityService: NoteEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const mutings = await this.noteMutingService.listByUserId(
				{ userId: me.id },
				{
					joinNote: true,
					limit: ps.limit,
					offset: ps.offset,
				});

			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const packedNotes = await this.noteEntityService.packMany(mutings.map(m => m.note!))
				.then(res => new Map(res.map(it => [it.id, it])));

			return mutings.map(m => ({
				id: m.id,
				expiresAt: m.expiresAt?.toISOString(),
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				note: packedNotes.get(m.noteId)!,
			}));
		});
	}
}
