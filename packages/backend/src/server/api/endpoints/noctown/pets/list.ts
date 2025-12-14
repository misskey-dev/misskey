/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * ペット一覧取得API
 * - プレイヤーが所有するすべてのペット（牛・鶏）を取得
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { NoctownService } from '@/core/NoctownService.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['noctown'],
	requireCredential: true,
	kind: 'read:account',
	res: {
		type: 'array',
		items: {
			type: 'object',
			properties: {
				id: { type: 'string' },
				type: { type: 'string' },
				name: { type: 'string', nullable: true },
				positionX: { type: 'number' },
				positionY: { type: 'number' },
				positionZ: { type: 'number' },
				spawnX: { type: 'number' },
				spawnZ: { type: 'number' },
				flavorText: { type: 'string' },
				hunger: { type: 'number' },
				happiness: { type: 'number' },
			},
		},
	},
	errors: {
		noPlayer: {
			message: 'Player not found',
			code: 'NO_PLAYER',
			id: 'a5c01f91-0014-4001-a000-000000000001',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		private noctownService: NoctownService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const player = await this.noctownService.getPlayer(me.id);
			if (!player) {
				throw new ApiError(meta.errors.noPlayer);
			}

			return await this.noctownService.getMyPets(player.id);
		});
	}
}
