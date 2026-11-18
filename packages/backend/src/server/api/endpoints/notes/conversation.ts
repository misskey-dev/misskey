/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import type { MiNote } from '@/models/Note.js';
import type { MiMeta, NotesRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { DI } from '@/di-symbols.js';
import { GetterService } from '@/server/api/GetterService.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['notes'],

	requireCredential: false,

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
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: 'e1035875-9551-45ec-afa8-1ded1fcb53c8',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		noteId: { type: 'string', format: 'misskey:id' },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		offset: { type: 'integer', default: 0 },
	},
	required: ['noteId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.meta)
		private serverSettings: MiMeta,

		private noteEntityService: NoteEntityService,
		private getterService: GetterService,
	) {
		super(meta, paramDef, async (ps, me) => {
			if (me == null && this.serverSettings.ugcVisibilityForVisitor === 'none') return [];

			const note = await this.getterService.getNote(ps.noteId).catch(err => {
				if (err.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(meta.errors.noSuchNote);
				throw err;
			});

			if (note.replyId == null) return [];

			// 負の offset は 0 として扱う
			const offset = Math.max(ps.offset, 0);
			const maxDepth = offset + ps.limit;

			// これほど深い返信の連なりは存在しえないので、クエリのパラメーターとして安全に扱えない値なら空を返す
			if (!Number.isSafeInteger(maxDepth)) return [];

			// 返信元を1件ずつ問い合わせると往復が返信の深さだけ発生するため、再帰クエリで1回にまとめる
			// たどる深さは offset + limit までに明示的に制限する
			const ancestors: { id: MiNote['id'] }[] = await this.notesRepository.query(`
				WITH RECURSIVE "ancestor" ("id", "replyId", "depth") AS (
					SELECT "id", "replyId", 1::bigint FROM "note" WHERE "id" = $1
					UNION ALL
					SELECT "note"."id", "note"."replyId", "ancestor"."depth" + 1
					FROM "note" INNER JOIN "ancestor" ON "note"."id" = "ancestor"."replyId"
					WHERE "ancestor"."depth" < $2
				)
				SELECT "id" FROM "ancestor" WHERE "depth" > $3 ORDER BY "depth"
			`, [note.replyId, maxDepth, offset]);

			if (ancestors.length === 0) return [];

			const notes = await this.notesRepository.findBy({ id: In(ancestors.map(x => x.id)) });
			const noteMap = new Map(notes.map(x => [x.id, x]));
			const conversation = ancestors.map(x => noteMap.get(x.id)).filter(x => x != null);

			return await this.noteEntityService.packMany(conversation, me);
		});
	}
}
