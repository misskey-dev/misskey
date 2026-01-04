/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { NoqQuestionsRepository, UsersRepository, NotesRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { NoqestionService } from '@/core/NoqestionService.js';
import { noqQuestionStatuses, noqCardDesigns } from '@/models/NoqQuestion.js';
import type { NoqQuestionStatus } from '@/models/NoqQuestion.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';

/**
 * noq/questions/received
 * 自分が受信した質問一覧を取得
 */
export const meta = {
	tags: ['noq'],

	requireCredential: true,

	kind: 'read:noq',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			properties: {
				id: {
					type: 'string',
					optional: false, nullable: false,
					format: 'id',
				},
				text: {
					type: 'string',
					optional: false, nullable: false,
				},
				imageUrl: {
					type: 'string',
					optional: false, nullable: true,
				},
				isUsernameDisclosed: {
					type: 'boolean',
					optional: false, nullable: false,
				},
				isNoReplyRequested: {
					type: 'boolean',
					optional: false, nullable: false,
				},
				cardDesign: {
					type: 'string',
					optional: false, nullable: false,
				},
				status: {
					type: 'string',
					optional: false, nullable: false,
				},
				sender: {
					type: 'object',
					optional: false, nullable: true,
				},
				senderId: {
					type: 'string',
					optional: false, nullable: true,
					format: 'id',
				},
				isE2EEncrypted: {
					type: 'boolean',
					optional: false, nullable: false,
				},
				answerNoteId: {
					type: 'string',
					optional: false, nullable: true,
					format: 'id',
				},
				answerText: {
					type: 'string',
					optional: false, nullable: true,
				},
				createdAt: {
					type: 'string',
					optional: false, nullable: false,
					format: 'date-time',
				},
				answeredAt: {
					type: 'string',
					optional: false, nullable: true,
					format: 'date-time',
				},
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		status: { type: 'string', enum: noqQuestionStatuses },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.noqQuestionsRepository)
		private noqQuestionsRepository: NoqQuestionsRepository,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private noqestionService: NoqestionService,
		private userEntityService: UserEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const questions = await this.noqestionService.getReceivedQuestions(me.id, {
				status: ps.status as NoqQuestionStatus | undefined,
				limit: ps.limit,
				sinceId: ps.sinceId,
				untilId: ps.untilId,
			});

			const result = [];
			for (const question of questions) {
				let sender = null;
				// username開示されている場合のみ送信者情報を含める
				if (question.isUsernameDisclosed && question.senderId) {
					const user = await this.usersRepository.findOneBy({ id: question.senderId });
					if (user) {
						sender = await this.userEntityService.pack(user, me, { schema: 'UserLite' });
					}
				}

				// 回答済みの場合、回答ノートのテキストを取得
				let answerText: string | null = null;
				if (question.answerNoteId) {
					const answerNote = await this.notesRepository.findOneBy({ id: question.answerNoteId });
					if (answerNote?.text) {
						answerText = answerNote.text;
					}
				}

				result.push({
					id: question.id,
					text: question.text,
					imageUrl: question.imageUrl,
					isUsernameDisclosed: question.isUsernameDisclosed,
					isNoReplyRequested: question.isNoReplyRequested,
					cardDesign: question.cardDesign,
					status: question.status,
					sender,
					senderId: question.senderId,
					isE2EEncrypted: question.isE2EEncrypted,
					answerNoteId: question.answerNoteId,
					answerText,
					createdAt: question.createdAt.toISOString(),
					answeredAt: question.answeredAt?.toISOString() ?? null,
				});
			}

			return result;
		});
	}
}
