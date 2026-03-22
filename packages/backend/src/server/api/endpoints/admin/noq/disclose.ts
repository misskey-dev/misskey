/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { NoqQuestionsRepository, UsersRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../../error.js';

/**
 * admin/noq/disclose
 * 質問者の情報を開示する（モデレーター権限必須）
 * - 通報された質問の送信者を特定するために使用
 */
export const meta = {
	tags: ['admin', 'noq'],

	requireCredential: true,
	requireModerator: true,
	secure: true,
	kind: 'write:admin:noq',

	errors: {
		noSuchQuestion: {
			message: 'No such question.',
			code: 'NO_SUCH_QUESTION',
			id: 'noq-disclose-0001',
		},
		senderDeleted: {
			message: 'Sender has been deleted.',
			code: 'SENDER_DELETED',
			id: 'noq-disclose-0002',
		},
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			senderId: {
				type: 'string',
				optional: false, nullable: false,
				format: 'id',
			},
			senderUsername: {
				type: 'string',
				optional: false, nullable: false,
			},
			senderHost: {
				type: 'string',
				optional: false, nullable: true,
			},
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

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			// 質問の存在確認
			const question = await this.noqQuestionsRepository.findOneBy({ id: ps.questionId });
			if (question == null) {
				throw new ApiError(meta.errors.noSuchQuestion);
			}

			// senderId が null の場合（ユーザー削除済み）はエラー
			if (question.senderId == null) {
				throw new ApiError(meta.errors.senderDeleted);
			}

			// 質問者情報を取得
			const sender = await this.usersRepository.findOneByOrFail({ id: question.senderId });

			// isDisclosedByModをtrueに更新
			await this.noqQuestionsRepository.update(
				{ id: ps.questionId },
				{ isDisclosedByMod: true },
			);

			return {
				senderId: sender.id,
				senderUsername: sender.username,
				senderHost: sender.host,
			};
		});
	}
}
