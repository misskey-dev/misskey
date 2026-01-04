/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import ms from 'ms';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { NoqQuestionsRepository, UsersRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { NoqestionService } from '@/core/NoqestionService.js';
import { GetterService } from '@/server/api/GetterService.js';
import { noqCardDesigns } from '@/models/NoqQuestion.js';
import { ApiError } from '../../../error.js';

/**
 * noq/questions/send
 * 匿名質問を送信する
 */
export const meta = {
	tags: ['noq'],

	requireCredential: true,
	prohibitMoved: true,

	kind: 'write:noq',

	limit: {
		duration: ms('1hour'),
		max: 30,
	},

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: 'b8e6f75c-1a1f-4c0d-9b8e-f75c1a1f4c0d',
		},
		noqestionDisabled: {
			message: 'Target user has not enabled Noqestion.',
			code: 'NOQESTION_DISABLED',
			id: 'c9f7f86d-2b2f-5d1e-ac9f-f86d2b2f5d1e',
		},
		usernameDisclosureRequired: {
			message: 'Target user requires username disclosure.',
			code: 'USERNAME_DISCLOSURE_REQUIRED',
			id: 'd0e8e97e-3c3f-6e2f-bd0e-e97e3c3f6e2f',
		},
		blocked: {
			message: 'You are blocked by the user.',
			code: 'BLOCKED',
			id: 'e1f9f08f-4d4f-7f3f-ce1f-f08f4d4f7f3f',
		},
		muted: {
			message: 'You are muted by the user.',
			code: 'MUTED',
			id: 'f2e0e19e-5e5f-8e4f-df2e-e19e5e5f8e4f',
		},
		containsNgWord: {
			message: 'Your question contains NG words.',
			code: 'CONTAINS_NG_WORD',
			id: 'a3f1f2af-6f6f-9f5f-ea3f-f2af6f6f9f5f',
		},
		cannotSendToSelf: {
			message: 'Cannot send question to yourself.',
			code: 'CANNOT_SEND_TO_SELF',
			id: 'b4e2e3be-7e7e-ae6e-fb4e-e3be7e7eae6e',
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
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		recipientId: { type: 'string', format: 'misskey:id' },
		text: { type: 'string', minLength: 1, maxLength: 3000 },
		imageUrl: { type: 'string', nullable: true, maxLength: 512 },
		isUsernameDisclosed: { type: 'boolean', default: false },
		isNoReplyRequested: { type: 'boolean', default: false },
		cardDesign: { type: 'string', enum: noqCardDesigns, default: 'default' },
	},
	required: ['recipientId', 'text'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.noqQuestionsRepository)
		private noqQuestionsRepository: NoqQuestionsRepository,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private noqestionService: NoqestionService,
		private getterService: GetterService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// 自分自身に送信不可
			if (me.id === ps.recipientId) {
				throw new ApiError(meta.errors.cannotSendToSelf);
			}

			// 対象ユーザーを取得
			const recipient = await this.getterService.getUser(ps.recipientId).catch(err => {
				if (err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(meta.errors.noSuchUser);
				throw err;
			});

			try {
				const question = await this.noqestionService.sendQuestion({
					senderId: me.id,
					recipientId: recipient.id,
					text: ps.text,
					imageUrl: ps.imageUrl,
					isUsernameDisclosed: ps.isUsernameDisclosed,
					isNoReplyRequested: ps.isNoReplyRequested,
					cardDesign: ps.cardDesign,
				});

				return {
					id: question.id,
				};
			} catch (err: unknown) {
				if (err instanceof Error) {
					switch (err.message) {
						case 'NOQESTION_DISABLED':
							throw new ApiError(meta.errors.noqestionDisabled);
						case 'USERNAME_DISCLOSURE_REQUIRED':
							throw new ApiError(meta.errors.usernameDisclosureRequired);
						case 'BLOCKED':
							throw new ApiError(meta.errors.blocked);
						case 'MUTED':
							throw new ApiError(meta.errors.muted);
						case 'CONTAINS_NG_WORD':
							throw new ApiError(meta.errors.containsNgWord);
					}
				}
				throw err;
			}
		});
	}
}
