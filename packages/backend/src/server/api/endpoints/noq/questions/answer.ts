/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { NoqQuestionsRepository, NotesRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { NoqestionService } from '@/core/NoqestionService.js';
import { ApiError } from '@/server/api/error.js';

/**
 * noq/questions/answer
 * 質問に回答する（回答ノートIDを紐付け）
 */
export const meta = {
	tags: ['noq'],

	requireCredential: true,

	kind: 'write:noq',

	errors: {
		noSuchQuestion: {
			message: 'No such question.',
			code: 'NO_SUCH_QUESTION',
			id: 'a3d2c6f1-0001-4001-8001-000000000001',
		},
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: 'a3d2c6f1-0001-4001-8001-000000000002',
		},
		accessDenied: {
			message: 'Access denied.',
			code: 'ACCESS_DENIED',
			id: 'a3d2c6f1-0001-4001-8001-000000000003',
		},
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			id: {
				type: 'string',
				optional: false, nullable: false,
				format: 'id',
			},
			status: {
				type: 'string',
				optional: false, nullable: false,
			},
			answerNoteId: {
				type: 'string',
				optional: false, nullable: true,
				format: 'id',
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		questionId: { type: 'string', format: 'misskey:id' },
		noteId: { type: 'string', format: 'misskey:id' },
		encryptedAnswer: { type: 'string', maxLength: 10000 },
	},
	required: ['questionId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.noqQuestionsRepository)
		private noqQuestionsRepository: NoqQuestionsRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private noqestionService: NoqestionService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// 質問の存在確認
			const question = await this.noqQuestionsRepository.findOneBy({ id: ps.questionId });
			if (question == null) {
				throw new ApiError(meta.errors.noSuchQuestion);
			}

			// E2E暗号化回答の場合
			if (ps.encryptedAnswer) {
				try {
					const updated = await this.noqestionService.updateQuestionStatusWithEncryptedAnswer(
						ps.questionId,
						me.id,
						ps.encryptedAnswer,
					);

					return {
						id: updated.id,
						status: updated.status,
						answerNoteId: updated.answerNoteId,
					};
				} catch (err) {
					if (err instanceof Error) {
						if (err.message === 'QUESTION_NOT_FOUND') {
							throw new ApiError(meta.errors.noSuchQuestion);
						}
						if (err.message === 'ACCESS_DENIED') {
							throw new ApiError(meta.errors.accessDenied);
						}
					}
					throw err;
				}
			}

			// 通常回答の場合（noteIdが必須）
			if (!ps.noteId) {
				throw new ApiError(meta.errors.noSuchNote);
			}

			// ノートの存在確認
			const note = await this.notesRepository.findOneBy({ id: ps.noteId });
			if (note == null) {
				throw new ApiError(meta.errors.noSuchNote);
			}

			// ノートの所有者確認
			if (note.userId !== me.id) {
				throw new ApiError(meta.errors.accessDenied);
			}

			try {
				const updated = await this.noqestionService.updateQuestionStatus(
					ps.questionId,
					me.id,
					'answered',
					ps.noteId,
				);

				return {
					id: updated.id,
					status: updated.status,
					answerNoteId: updated.answerNoteId,
				};
			} catch (err) {
				if (err instanceof Error) {
					if (err.message === 'QUESTION_NOT_FOUND') {
						throw new ApiError(meta.errors.noSuchQuestion);
					}
					if (err.message === 'ACCESS_DENIED') {
						throw new ApiError(meta.errors.accessDenied);
					}
				}
				throw err;
			}
		});
	}
}
