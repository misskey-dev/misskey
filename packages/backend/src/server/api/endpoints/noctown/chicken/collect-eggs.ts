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
			quantity: { type: 'number', optional: true },
		},
	},
	errors: {
		noPlayer: {
			message: 'Player not found',
			code: 'NO_PLAYER',
			id: 'a5c01f91-0009-4000-a000-000000000001',
		},
		chickenNotFound: {
			message: 'Chicken not found',
			code: 'CHICKEN_NOT_FOUND',
			id: 'a5c01f91-0009-4000-a000-000000000002',
		},
		noEggsReady: {
			message: 'No eggs ready to collect',
			code: 'NO_EGGS_READY',
			id: 'a5c01f91-0009-4000-a000-000000000003',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		chickenId: { type: 'string' },
	},
	required: ['chickenId'],
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

			const result = await this.noctownService.collectEggs(
				player.id,
				ps.chickenId,
			);

			if (!result.success) {
				if (result.error === 'CHICKEN_NOT_FOUND') {
					throw new ApiError(meta.errors.chickenNotFound);
				}
				if (result.error === 'NO_EGGS_READY') {
					throw new ApiError(meta.errors.noEggsReady);
				}
			}

			return { success: true, quantity: result.quantity };
		});
	}
}
