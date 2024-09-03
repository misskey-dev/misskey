/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import ms from 'ms';
import { Inject, Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { DriveFilesRepository, UsersRepository } from '@/models/_.js';
import { NoteEditService } from '@/core/NoteEditService.js';
import { GetterService } from '@/server/api/GetterService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { MAX_NOTE_TEXT_LENGTH } from '@/const.js';
import { RoleService } from '@/core/RoleService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['notes'],

	requireCredential: true,
	requireRolePolicy: 'canEditNote',

	kind: 'write:notes',

	limit: {
		duration: ms('1hour'),
		max: 10,
		minInterval: ms('2min'),
	},

	errors: {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: 'a6584e14-6e01-4ad3-b566-851e7bf0d474',
		},
		accessDenied: {
			message: 'Access denied.',
			code: 'ACCESS_DENIED',
			id: 'fe8d7103-0ea8-4ec3-814d-f8b401dc69e9',
		},
		cannotEditNote: {
			message: 'Editing notes are not allowed by the role policy.',
			code: 'CANNOT_EDIT_NOTE',
			id: '59ece09c-56ab-4bd5-905c-0f6bbf5af143',
		},
		containsProhibitedWords: {
			message: 'Cannot post because it contains prohibited words.',
			code: 'CONTAINS_PROHIBITED_WORDS',
			id: 'aa6e01d3-a85c-669d-758a-76aab43af334',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		noteId: { type: 'string', format: 'misskey:id' },
		text: {
			type: 'string',
			minLength: 1,
			maxLength: MAX_NOTE_TEXT_LENGTH,
			nullable: true,
		},
		cw: {
			type: 'string',
			nullable: true,
			maxLength: 100,
		},
		fileIds: {
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
	if: {
		properties: {
			renoteId: {
				type: 'null',
			},
			fileIds: {
				type: 'null',
			},
			poll: {
				type: 'null',
			},
		},
	},
	then: {
		properties: {
			text: {
				type: 'string',
				minLength: 1,
				maxLength: MAX_NOTE_TEXT_LENGTH,
				pattern: '[^\\s]+',
			},
		},
		required: ['text'],
	},
	required: ['noteId', 'text', 'cw'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private getterService: GetterService,
		private globalEventService: GlobalEventService,
		private noteEditService: NoteEditService,
		private roleService: RoleService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const note = await this.getterService.getNote(ps.noteId).catch(err => {
				if (err.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(meta.errors.noSuchNote);
				throw err;
			});

			// この操作を行うのが投稿者とは限らない(例えばモデレーター)ため
			if (!await this.roleService.isModerator(me)) {
				if (note.userId !== me.id) {
					throw new ApiError(meta.errors.accessDenied);
				} else if ((await this.roleService.getUserPolicies(me.id)).canEditNote !== true) {
					throw new ApiError(meta.errors.cannotEditNote);
				}
			}

			try {
				const targetNote = await this.noteEditService.edit(await this.usersRepository.findOneByOrFail({ id: note.userId }), note.id, {
					text: ps.text,
					cw: ps.cw,
					files: ps.fileIds ? await this.driveFilesRepository.findBy({ id: In(ps.fileIds) }) : undefined,
					poll: ps.poll ? {
						choices: ps.poll.choices,
						multiple: ps.poll.multiple ?? false,
						expiresAt: ps.poll.expiresAt ? new Date(ps.poll.expiresAt) : null,
					} : undefined,
				}, undefined, me);
				this.globalEventService.publishNoteStream(note.id, 'edited', {
					note: targetNote,
				});
			} catch (e) {
				if (e instanceof NoteEditService.ContainsProhibitedWordsError) {
					throw new ApiError(meta.errors.containsProhibitedWords);
				}
				throw e;
			}
		});
	}
}
