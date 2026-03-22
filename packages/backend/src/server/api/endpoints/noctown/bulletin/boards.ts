/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type { NoctownBulletinBoardsRepository, NoctownPlayersRepository } from '@/models/_.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['noctown'],
	requireCredential: true,
	kind: 'read:account',
	errors: {
		noPlayer: {
			message: 'Player not found.',
			code: 'NO_PLAYER',
			id: 'f2b01f01-0001-0001-0001-000000000001',
		},
	},
	res: {
		type: 'array',
		items: {
			type: 'object',
			properties: {
				id: { type: 'string' },
				worldId: { type: 'string' },
				positionX: { type: 'number' },
				positionZ: { type: 'number' },
				name: { type: 'string', nullable: true },
				boardType: { type: 'number' },
				createdAt: { type: 'string' },
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		worldId: { type: 'string', format: 'misskey:id' },
	},
	required: ['worldId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.noctownPlayersRepository)
		private noctownPlayersRepository: NoctownPlayersRepository,
		@Inject(DI.noctownBulletinBoardsRepository)
		private noctownBulletinBoardsRepository: NoctownBulletinBoardsRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			const player = await this.noctownPlayersRepository.findOneBy({ userId: me.id });
			if (!player) {
				throw new ApiError(meta.errors.noPlayer);
			}

			const boards = await this.noctownBulletinBoardsRepository.find({
				where: { worldId: ps.worldId },
				order: { createdAt: 'DESC' },
			});

			return boards.map(board => ({
				id: board.id,
				worldId: board.worldId,
				positionX: board.positionX,
				positionZ: board.positionZ,
				name: board.name,
				boardType: board.boardType,
				createdAt: board.createdAt.toISOString(),
			}));
		});
	}
}
