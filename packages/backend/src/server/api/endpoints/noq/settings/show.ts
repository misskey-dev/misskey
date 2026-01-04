/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { IsNull } from 'typeorm';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { NoqUserSettingsRepository, UsersRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { NoqestionService } from '@/core/NoqestionService.js';
import { ApiError } from '@/server/api/error.js';
import { GetterService } from '@/server/api/GetterService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';

/**
 * noq/settings/show
 * 特定ユーザーの質問箱設定を取得（公開情報のみ）
 * 質問を送る前に相手が質問箱を有効化しているか確認するため
 */
export const meta = {
	tags: ['noq'],

	requireCredential: false,

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			isEnabled: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			requireUsernameDisclosure: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			notice: {
				type: 'string',
				optional: false, nullable: true,
			},
			hasE2EKey: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			e2ePublicKey: {
				type: 'string',
				optional: false, nullable: true,
			},
			user: {
				type: 'object',
				optional: false, nullable: false,
			},
		},
	},

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: 'e3d2c6f1-0001-4001-8001-000000000001',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
		username: { type: 'string' },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.noqUserSettingsRepository)
		private noqUserSettingsRepository: NoqUserSettingsRepository,

		private noqestionService: NoqestionService,
		private getterService: GetterService,
		private userEntityService: UserEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			let targetUser;

			if (ps.userId) {
				targetUser = await this.getterService.getUser(ps.userId).catch(() => null);
			} else if (ps.username) {
				targetUser = await this.usersRepository.findOneBy({
					usernameLower: ps.username.toLowerCase(),
					host: IsNull(),
				});
			}

			if (targetUser == null) {
				throw new ApiError(meta.errors.noSuchUser);
			}

			// 設定を取得（存在しなければデフォルト値）
			const setting = await this.noqUserSettingsRepository.findOneBy({ userId: targetUser.id });

			const packedUser = await this.userEntityService.pack(targetUser, me, { schema: 'UserLite' });

			return {
				isEnabled: setting?.isEnabled ?? false,
				requireUsernameDisclosure: setting?.requireUsernameDisclosure ?? false,
				notice: setting?.notice ?? null,
				hasE2EKey: !!setting?.e2ePublicKey,
				e2ePublicKey: setting?.e2ePublicKey ?? null,
				user: packedUser,
			};
		});
	}
}
