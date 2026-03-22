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
			cowId: { type: 'string', optional: true },
		},
	},
	errors: {
		noPlayer: {
			message: 'Player not found',
			code: 'NO_PLAYER',
			id: 'a5c01f91-0011-4000-a000-000000000001',
		},
		maxCowsReached: {
			message: 'Maximum cows reached',
			code: 'MAX_COWS_REACHED',
			id: 'a5c01f91-0011-4000-a000-000000000002',
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

			const result = await this.noctownService.placeCow(
				player.id,
				ps.x,
				ps.y,
				ps.z,
				ps.name,
			);

			if (!result.success) {
				if (result.error === 'MAX_COWS_REACHED') {
					throw new ApiError(meta.errors.maxCowsReached);
				}
			}

			return { success: true, cowId: result.cowId };
		});
	}
}
