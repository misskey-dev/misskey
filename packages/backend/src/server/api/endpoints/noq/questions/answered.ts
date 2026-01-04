/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { IsNull } from 'typeorm';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { NoqQuestionsRepository, UsersRepository, NotesRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { noqCardDesigns } from '@/models/NoqQuestion.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { ApiError } from '@/server/api/error.js';

/**
 * noq/questions/answered
 * 特定ユーザーの回答済み質問一覧を取得（公開API）
 * セキュリティ: 回答済み(status='answered')の質問のみ返す。未回答質問は絶対に返さない。
 */
export const meta = {
	tags: ['noq'],

	// 認証不要（公開API）
	requireCredential: false,

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
				cardDesign: {
					type: 'string',
					optional: false, nullable: false,
				},
				sender: {
					type: 'object',
					optional: false, nullable: true,
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

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: 'b7f3d9e0-noq-answered-user-not-found',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
		username: { type: 'string' },
		host: { type: 'string', nullable: true },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
	},
	anyOf: [
		{ required: ['userId'] },
		{ required: ['username'] },
	],
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

		private userEntityService: UserEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// ユーザーを特定
			let targetUserId: string;

			if (ps.userId) {
				targetUserId = ps.userId;
			} else if (ps.username) {
				const user = await this.usersRepository.findOneBy({
					usernameLower: ps.username.toLowerCase(),
					host: ps.host ?? IsNull(),
				});
				if (!user) {
					throw new ApiError(meta.errors.noSuchUser);
				}
				targetUserId = user.id;
			} else {
				throw new ApiError(meta.errors.noSuchUser);
			}

			// セキュリティ: 回答済み質問のみ取得（status = 'answered'のみ）
			const query = this.noqQuestionsRepository.createQueryBuilder('question')
				.where('question.recipientId = :recipientId', { recipientId: targetUserId })
				.andWhere('question.status = :status', { status: 'answered' }) // 重要: 回答済みのみ
				.orderBy('question.answeredAt', 'DESC');

			if (ps.sinceId) {
				query.andWhere('question.id > :sinceId', { sinceId: ps.sinceId });
			}
			if (ps.untilId) {
				query.andWhere('question.id < :untilId', { untilId: ps.untilId });
			}

			query.take(ps.limit);

			const questions = await query.getMany();

			const result = [];
			for (const question of questions) {
				let sender = null;
				// username開示されている場合のみ送信者情報を含める
				if (question.isUsernameDisclosed && question.senderId) {
					const user = await this.usersRepository.findOneBy({ id: question.senderId });
					if (user) {
						sender = await this.userEntityService.pack(user, me ?? null, { schema: 'UserLite' });
					}
				}

				// 回答テキストを取得
				// 優先順位: 1. カラムに保存された値 2. ノートからの抽出（フォールバック）
				let answerText: string | null = question.answerText;
				if (!answerText && question.answerNoteId) {
					// フォールバック: 古いデータ用にノートからテキストを抽出
					const answerNote = await this.notesRepository.findOneBy({ id: question.answerNoteId });
					if (answerNote?.text) {
						// "A. "で始まる回答テキストを抽出
						const match = answerNote.text.match(/^A\.\s*(.+?)(?=\n#Noquestion|\n\[質問する\]|$)/s);
						if (match) {
							answerText = match[1].trim();
						} else {
							// フォールバック: 全文を使用
							answerText = answerNote.text;
						}
					}
				}

				result.push({
					id: question.id,
					text: question.text,
					imageUrl: question.imageUrl,
					isUsernameDisclosed: question.isUsernameDisclosed,
					cardDesign: question.cardDesign,
					sender,
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
