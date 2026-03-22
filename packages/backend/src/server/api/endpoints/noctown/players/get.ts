/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 特定のプレイヤーIDに対応するPlayerDataを取得するエンドポイント
// Ping受信時に送信者が画面に表示されていない場合、このエンドポイントでデータを要求する

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { RoleService } from '@/core/RoleService.js';
import type { NoctownPlayersRepository, UsersRepository } from '@/models/_.js';

export const meta = {
	tags: ['noctown'],

	requireCredential: true,
	kind: 'read:account',

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			id: { type: 'string' },
			userId: { type: 'string' },
			username: { type: 'string' },
			name: { type: 'string', nullable: true },
			avatarUrl: { type: 'string', nullable: true },
			positionX: { type: 'number' },
			positionY: { type: 'number' },
			positionZ: { type: 'number' },
			rotation: { type: 'number' },
			skinId: { type: 'string', nullable: true },
			skinData: { type: 'object', nullable: true },
			isOnline: { type: 'boolean' },
			isSuspended: { type: 'boolean' },
			isSilenced: { type: 'boolean' },
		},
	},

	errors: {
		noSuchPlayer: {
			message: 'No such player.',
			code: 'NO_SUCH_PLAYER',
			id: '3e8e9d0a-1b2c-4d3e-9f0a-1b2c3d4e5f6a',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		playerId: { type: 'string' },
	},
	required: ['playerId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.noctownPlayersRepository)
		private noctownPlayersRepository: NoctownPlayersRepository,

		private roleService: RoleService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const player = await this.noctownPlayersRepository.findOneBy({ id: ps.playerId });
			if (!player) {
				throw new Error('NO_SUCH_PLAYER');
			}

			const user = await this.usersRepository.findOneBy({ id: player.userId });
			const policies = await this.roleService.getUserPolicies(player.userId);
			const isSilenced = !policies.canPublicNote;

			// name: Misskeyユーザーの表示名（設定されていない場合はnull）
			return {
				id: player.id,
				userId: player.userId,
				username: user?.username ?? 'unknown',
				name: user?.name ?? null,
				avatarUrl: user?.avatarUrl ?? null,
				positionX: player.positionX,
				positionY: player.positionY,
				positionZ: player.positionZ,
				rotation: player.rotation,
				skinId: null,
				skinData: null,
				isOnline: player.isOnline,
				isSuspended: user?.isSuspended ?? false,
				isSilenced,
			};
		});
	}
}
