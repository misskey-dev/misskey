/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ChatService } from '@/core/ChatService.js';
import { UtilityService } from '@/core/UtilityService.js';
import { ApiError } from '@/server/api/error.js';
import { DI } from '@/di-symbols.js';
import type { ChatApprovalsRepository, FollowingsRepository, UsersRepository } from '@/models/_.js';

export const meta = {
	tags: ['chat'],

	requireCredential: true,

	kind: 'write:chat',

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			action: {
				type: 'string',
				optional: false, nullable: false,
				enum: ['created', 'deleted', 'no_action'],
			},
			isMutual: {
				type: 'boolean',
				optional: false, nullable: false,
			},
		},
	},

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: 'e1acafb8-8740-4d8e-b669-f79991a60c2c',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
	},
	required: ['userId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		@Inject(DI.chatApprovalsRepository)
		private chatApprovalsRepository: ChatApprovalsRepository,

		private chatService: ChatService,
		private utilityService: UtilityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			await this.chatService.checkChatAvailability(me.id, 'write');

			// 対象ユーザーの存在確認
			const user = await this.usersRepository.findOneBy({ id: ps.userId });
			if (!user) {
				throw new ApiError(meta.errors.noSuchUser);
			}

			// 相互フォロー状態を確認
			const isMutual = await this.utilityService.isMutualFollowing(me.id, ps.userId);

			// 既存のChat Approvalレコードを確認
			const existingApproval1 = await this.chatApprovalsRepository.findOneBy({
				userId: me.id,
				otherId: ps.userId,
			});
			const existingApproval2 = await this.chatApprovalsRepository.findOneBy({
				userId: ps.userId,
				otherId: me.id,
			});

			let action: 'created' | 'deleted' | 'no_action' = 'no_action';

			if (isMutual) {
				// 相互フォローの場合：Chat Approvalを作成（まだ存在しない場合）
				if (!existingApproval1) {
					await this.chatApprovalsRepository.insert({
						id: this.utilityService.genId(),
						userId: me.id,
						otherId: ps.userId,
					});
					action = 'created';
				}
				if (!existingApproval2) {
					await this.chatApprovalsRepository.insert({
						id: this.utilityService.genId(),
						userId: ps.userId,
						otherId: me.id,
					});
					action = 'created';
				}
			} else {
				// 相互フォローでない場合：Chat Approvalを削除（存在する場合）
				if (existingApproval1) {
					await this.chatApprovalsRepository.delete({
						userId: me.id,
						otherId: ps.userId,
					});
					action = 'deleted';
				}
				if (existingApproval2) {
					await this.chatApprovalsRepository.delete({
						userId: ps.userId,
						otherId: me.id,
					});
					action = 'deleted';
				}
			}

			return {
				action,
				isMutual,
			};
		});
	}
}
