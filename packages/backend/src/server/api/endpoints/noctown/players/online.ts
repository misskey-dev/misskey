/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { NoctownService } from '@/core/NoctownService.js';
import { RoleService } from '@/core/RoleService.js';
import type { NoctownPlayersRepository, UsersRepository } from '@/models/_.js';

export const meta = {
	tags: ['noctown'],

	requireCredential: true,
	kind: 'read:account',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
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
				isOnline: { type: 'boolean' },
				isSuspended: { type: 'boolean' },
				isSilenced: { type: 'boolean' },
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.noctownPlayersRepository)
		private noctownPlayersRepository: NoctownPlayersRepository,

		private noctownService: NoctownService,
		private roleService: RoleService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const onlinePlayers = await this.noctownService.getOnlinePlayers();

			// Get user info for each player
			const results = await Promise.all(
				onlinePlayers
					.filter(player => player.userId !== me.id) // Exclude self
					.map(async (player) => {
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
							isOnline: player.isOnline,
							isSuspended: user?.isSuspended ?? false,
							isSilenced,
						};
					}),
			);

			return results;
		});
	}
}
