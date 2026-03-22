/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * ペット作成API
 * - プレイヤーが牛または鶏を作成する
 * - 上限10匹まで（牛+鶏合計）
 * - マルコフ連鎖でフレーバーテキストを自動生成
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { NoctownService } from '@/core/NoctownService.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['noctown'],
	requireCredential: true,
	kind: 'write:account',
	res: {
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
		},
	},
	errors: {
		noPlayer: {
			message: 'Player not found',
			code: 'NO_PLAYER',
			id: 'a5c01f91-0014-4000-a000-000000000001',
		},
		maxPetsReached: {
			message: 'Maximum pets reached (10)',
			code: 'MAX_PETS_REACHED',
			id: 'a5c01f91-0014-4000-a000-000000000002',
		},
		invalidType: {
			message: 'Invalid pet type. Must be "cow" or "chicken"',
			code: 'INVALID_TYPE',
			id: 'a5c01f91-0014-4000-a000-000000000003',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		type: { type: 'string', enum: ['cow', 'chicken'] },
		name: { type: 'string', maxLength: 64 },
		x: { type: 'number' },
		z: { type: 'number' },
	},
	required: ['type', 'x', 'z'],
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

			// ペット上限チェック（10匹まで）
			const petCount = await this.noctownService.getPetCount(player.id);
			if (petCount >= 10) {
				throw new ApiError(meta.errors.maxPetsReached);
			}

			if (ps.type !== 'cow' && ps.type !== 'chicken') {
				throw new ApiError(meta.errors.invalidType);
			}

			const pet = await this.noctownService.createPet(
				player.id,
				ps.type,
				ps.name ?? null,
				ps.x,
				ps.z,
			);

			return pet;
		});
	}
}
