/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import ms from 'ms';
import { Inject, Injectable } from '@nestjs/common';
import type { UsersRepository, NotesRepository , DriveFilesRepository, MiDriveFile} from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { NoteDeleteService } from '@/core/NoteDeleteService.js';
import { DI } from '@/di-symbols.js';
import { GetterService } from '@/server/api/GetterService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { MAX_NOTE_TEXT_LENGTH } from '@/const.js';
import { ApiError } from '../../error.js';


export const meta = {
	tags: ['notes'],

	requireCredential: true,
	requireRolePolicy: 'canEditNote',

	kind: 'write:notes',

	limit: {
		duration: ms('1hour'),
		max: 10,
		minInterval: ms('1sec'),
	},

	errors: {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: 'a6584e14-6e01-4ad3-b566-851e7bf0d474',
		},
      noSuchFile: {
          message: 'Some files are not found.',
          code: 'NO_SUCH_FILE',
          id: 'b6992544-63e7-67f0-fa7f-32444b1b5306',
      },
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		noteId: { type: 'string', format: 'misskey:id' },
		visibility: { type: 'string', enum: ['public', 'home', 'followers', 'specified'], default: 'public' },
		visibleUserIds: { type: 'array', uniqueItems: true, items: {
				type: 'string', format: 'misskey:id',
			} },
		cw: { type: 'string', nullable: true, maxLength: 100 },
		localOnly: { type: 'boolean', default: false },
		reactionAcceptance: { type: 'string', nullable: true, enum: [null, 'likeOnly', 'likeOnlyForRemote', 'nonSensitiveOnly', 'nonSensitiveOnlyForLocalLikeOnlyForRemote'], default: null },
		noExtractMentions: { type: 'boolean', default: false },
		noExtractHashtags: { type: 'boolean', default: false },
		noExtractEmojis: { type: 'boolean', default: false },
		replyId: { type: 'string', format: 'misskey:id', nullable: true },
		renoteId: { type: 'string', format: 'misskey:id', nullable: true },
		channelId: { type: 'string', format: 'misskey:id', nullable: true },

		// anyOf内にバリデーションを書いても最初の一つしかチェックされない
		// See https://github.com/misskey-dev/misskey/pull/10082
		text: {
			type: 'string',
			minLength: 1,
			maxLength: MAX_NOTE_TEXT_LENGTH,
			nullable: true,
		},
		fileIds: {
			type: 'array',
			uniqueItems: true,
			minItems: 1,
			maxItems: 16,
			items: { type: 'string', format: 'misskey:id' },
		},
		mediaIds: {
			type: 'array',
			uniqueItems: true,
			minItems: 1,
			maxItems: 16,
			items: { type: 'string', format: 'misskey:id' },
		},
		poll: {
			type: 'object',
			nullable: true,
			properties: {
				choices: {
					type: 'array',
					uniqueItems: true,
					minItems: 2,
					maxItems: 10,
					items: { type: 'string', minLength: 1, maxLength: 50 },
				},
				multiple: { type: 'boolean' },
				expiresAt: { type: 'integer', nullable: true },
				expiredAfter: { type: 'integer', nullable: true, minimum: 1 },
			},
			required: ['choices'],
		},
	},
	// (re)note with text, files and poll are optional
	anyOf: [
		{ required: ['text'] },
		{ required: ['renoteId'] },
		{ required: ['fileIds'] },
		{ required: ['mediaIds'] },
		{ required: ['poll'] },
	],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

    @Inject(DI.driveFilesRepository)
    private driveFilesRepository: DriveFilesRepository,

		private getterService: GetterService,
		private globalEventService: GlobalEventService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const note = await this.getterService.getNote(ps.noteId).catch(err => {
				if (err.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(meta.errors.noSuchNote);
				throw err;
			});

        let files: MiDriveFile[] = [];
        const fileIds = ps.fileIds ?? null;

        if (fileIds != null) {
            files = await this.driveFilesRepository.createQueryBuilder('file')
                .where('file.userId = :userId AND file.id IN (:...fileIds)', {
                    userId: me.id,
                    fileIds,
                })
                .orderBy('array_position(ARRAY[:...fileIds], "id"::text)')
                .setParameters({ fileIds })
                .getMany();

            if (files.length !== fileIds.length) {
                throw new ApiError(meta.errors.noSuchFile);
            }
        }

			if (note.userId !== me.id) {
				throw new ApiError(meta.errors.noSuchNote);
			}


			await this.notesRepository.update({ id: note.id }, {
				updatedAt: new Date(),
				cw: ps.cw,
				text: ps.text,
				fileIds: files.length > 0 ? files.map(f => f.id) : undefined,
			});

			this.globalEventService.publishNoteStream(note.id, 'updated', {
				cw: ps.cw,
				text: ps.text,
			});
		});
	}
}
