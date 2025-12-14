/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * ペット詳細取得API
 * - 指定IDのペット（牛・鶏）の詳細情報を取得
 * - ペット情報フローティングウィンドウで使用
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
		type: 'object',
		properties: {
			id: { type: 'string' },
			type: { type: 'string' },
			name: { type: 'string', nullable: true },
			ownerName: { type: 'string', nullable: true },
			ownerId: { type: 'string' },
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
	errors: {
		noPlayer: {
			message: 'Player not found',
			code: 'NO_PLAYER',
			id: 'a5c01f91-0014-4003-a000-000000000001',
		},
		petNotFound: {
			message: 'Pet not found',
			code: 'PET_NOT_FOUND',
			id: 'a5c01f91-0014-4003-a000-000000000002',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		petId: { type: 'string' },
	},
	required: ['petId'],
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

			const pet = await this.noctownService.getPetById(ps.petId);
			if (!pet) {
				throw new ApiError(meta.errors.petNotFound);
			}

			return pet;
		});
	}
}
