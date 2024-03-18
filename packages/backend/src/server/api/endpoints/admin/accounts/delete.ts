/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type { UsersRepository } from '@/models/_.js';
import { RoleService } from '@/core/RoleService.js';
import { DeleteAccountService } from '@/core/DeleteAccountService.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireAdmin: true,
	kind: 'write:admin:account',

	errors: {
		userNotFound: {
			message: 'User not found.',
			code: 'USER_NOT_FOUND',
			id: '6c45276a-525e-46b0-892f-17a5036258bf',
		},

		cannotDeleteModerator: {
			message: 'Cannot delete a moderator.',
			code: 'CANNOT_DELETE_MODERATOR',
			id: 'd195c621-f21a-4c2f-a634-484c2a616311',
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

		private roleService: RoleService,
		private deleteAccountService: DeleteAccountService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const user = await this.usersRepository.findOneBy({ id: ps.userId });

			if (user == null) throw new ApiError(meta.errors.userNotFound);
			if (await this.roleService.isModerator(user)) throw new ApiError(meta.errors.cannotDeleteModerator);

			// 管理者からの削除ということはモデレーション行為なので、soft delete にする
			await this.deleteAccountService.deleteAccount(user, true, me);
		});
	}
}
