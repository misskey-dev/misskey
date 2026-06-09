/*
 * SPDX-FileCopyrightText: Rickskey Project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { NotesRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';

export const meta = {
	tags: ['notes', 'shorts'],
	requireCredential: false,
	kind: 'read:account',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			ref: 'Note',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 50, default: 20 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private noteEntityService: NoteEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// ショート動画: 縦型(height >= width)または正方形の動画ファイルが添付されたノート
			const query = this.notesRepository.createQueryBuilder('note')
				.innerJoin(
					'drive_file',
					'file',
					'file.id = ANY(note."fileIds") AND file.type LIKE :videoType AND (file.properties->>\'height\')::float >= (file.properties->>\'width\')::float',
					{ videoType: 'video/%' },
				)
				.where('note."userHost" IS NULL')
				.andWhere('note.visibility = :vis', { vis: 'public' })
				.andWhere('note."fileIds" != \'{}\'')
				.orderBy('note.id', 'DESC')
				.limit(ps.limit);

			if (ps.sinceId) query.andWhere('note.id > :sinceId', { sinceId: ps.sinceId });
			if (ps.untilId) query.andWhere('note.id < :untilId', { untilId: ps.untilId });

			const notes = await query.getMany();
			return this.noteEntityService.packMany(notes, me ?? null, { detail: true });
		});
	}
}
