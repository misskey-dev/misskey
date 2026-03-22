/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { NoqQuestionsRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { NoqestionService } from '@/core/NoqestionService.js';
import { ApiError } from '@/server/api/error.js';

/**
 * noq/questions/delete
 * 質問を削除する（受信者のみ）
 */
export const meta = {
	tags: ['noq'],

	requireCredential: true,

	kind: 'write:noq',

	errors: {
		noSuchQuestion: {
			message: 'No such question.',
			code: 'NO_SUCH_QUESTION',
			id: 'b3d2c6f1-0001-4001-8001-000000000001',
		},
		accessDenied: {
			message: 'Access denied.',
			code: 'ACCESS_DENIED',
			id: 'b3d2c6f1-0001-4001-8001-000000000002',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		questionId: { type: 'string', format: 'misskey:id' },
	},
	required: ['questionId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.noqQuestionsRepository)
		private noqQuestionsRepository: NoqQuestionsRepository,

		private noqestionService: NoqestionService,
	) {
		super(meta, paramDef, async (ps, me) => {
			try {
				await this.noqestionService.deleteQuestion(ps.questionId, me.id);
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
