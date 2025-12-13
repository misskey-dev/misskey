/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { NoctownService } from '@/core/NoctownService.js';
import { RoleService } from '@/core/RoleService.js';
import type {
	NoctownPlayersRepository,
	NoctownWalletsRepository,
	NoctownPlayerItemsRepository,
	NoctownPlayerScoresRepository,
	NoctownWorldsRepository,
	UsersRepository,
} from '@/models/_.js';

export const meta = {
	tags: ['noctown'],

	requireCredential: true,
	kind: 'read:account',

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			id: { type: 'string' },
			username: { type: 'string' },
			avatarUrl: { type: 'string', nullable: true },
			positionX: { type: 'number' },
			positionY: { type: 'number' },
			positionZ: { type: 'number' },
			rotation: { type: 'number' },
			isOnline: { type: 'boolean' },
			balance: { type: 'string' },
			totalScore: { type: 'number' },
			createdAt: { type: 'string', format: 'date-time' },
			isSuspended: { type: 'boolean' },
			isSilenced: { type: 'boolean' },
			worldId: { type: 'string' },
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
		@Inject(DI.noctownPlayersRepository)
		private noctownPlayersRepository: NoctownPlayersRepository,

		@Inject(DI.noctownWalletsRepository)
		private noctownWalletsRepository: NoctownWalletsRepository,

		@Inject(DI.noctownPlayerScoresRepository)
		private noctownPlayerScoresRepository: NoctownPlayerScoresRepository,

		@Inject(DI.noctownWorldsRepository)
		private noctownWorldsRepository: NoctownWorldsRepository,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private noctownService: NoctownService,
		private roleService: RoleService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// Get or create player
			let player = await this.noctownPlayersRepository.findOneBy({ userId: me.id });
			if (!player) {
				player = await this.noctownService.createPlayer(me.id);
			}

			// Get wallet
			const wallet = await this.noctownWalletsRepository.findOneBy({ playerId: player.id });

			// Get score
			const score = await this.noctownPlayerScoresRepository.findOneBy({ playerId: player.id });

			// Get user status
			const user = await this.usersRepository.findOneBy({ id: me.id });

			// Get silenced status from role policies
			const policies = await this.roleService.getUserPolicies(me.id);
			const isSilenced = !policies.canPublicNote;

			// Get default world ID
			const defaultWorld = await this.noctownWorldsRepository.findOne({
				order: { createdAt: 'ASC' },
			});
			const worldId = defaultWorld?.id ?? 'default';

			return {
				id: player.id,
				username: user?.username ?? '',
				avatarUrl: user?.avatarUrl ?? null,
				positionX: player.positionX,
				positionY: player.positionY,
				positionZ: player.positionZ,
				rotation: player.rotation,
				isOnline: player.isOnline,
				balance: wallet?.balance ?? '0',
				totalScore: score?.totalScore ?? 0,
				createdAt: player.createdAt.toISOString(),
				isSuspended: user?.isSuspended ?? false,
				isSilenced,
				worldId,
			};
		});
	}
}
