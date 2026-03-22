/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
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
			success: { type: 'boolean' },
			chickenId: { type: 'string', optional: true },
		},
	},
	errors: {
		noPlayer: {
			message: 'Player not found',
			code: 'NO_PLAYER',
			id: 'a5c01f91-0007-4000-a000-000000000001',
		},
		maxChickensReached: {
			message: 'Maximum chickens reached',
			code: 'MAX_CHICKENS_REACHED',
			id: 'a5c01f91-0007-4000-a000-000000000002',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		x: { type: 'number' },
		y: { type: 'number' },
		z: { type: 'number' },
		name: { type: 'string', maxLength: 64 },
	},
	required: ['x', 'y', 'z'],
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

			const result = await this.noctownService.placeChicken(
				player.id,
				ps.x,
				ps.y,
				ps.z,
				ps.name,
			);

			if (!result.success) {
				if (result.error === 'MAX_CHICKENS_REACHED') {
					throw new ApiError(meta.errors.maxChickensReached);
				}
			}

			return { success: true, chickenId: result.chickenId };
		});
	}
}
