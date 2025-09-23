/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { UsersRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@/server/api/error.js';
import { ChatService } from '@/core/ChatService.js';

export const meta = {
	tags: ['chat'],

	requireCredential: true,

	secure: true,

	kind: 'write:user:chat',

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: 'e6965129-7b2a-40a4-bae2-cd84cd434822',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
		isSecretMessageMode: { type: 'boolean' },
	},
	required: ['userId', 'isSecretMessageMode'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private chatService: ChatService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// ユーザーの存在確認
			const user = await this.usersRepository.findOneBy({ id: ps.userId });
			if (user == null) {
				throw new ApiError(meta.errors.noSuchUser);
			}

			// 内緒の会話設定を変更
			await this.chatService.setSecretModeForUsers(me.id, ps.userId, ps.isSecretMessageMode, me.id);

			return {};
		});
	}
}