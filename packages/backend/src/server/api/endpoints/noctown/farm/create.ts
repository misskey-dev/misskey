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
			plotId: { type: 'string', optional: true },
		},
	},
	errors: {
		noPlayer: {
			message: 'Player not found',
			code: 'NO_PLAYER',
			id: 'a5c01f91-0002-4000-a000-000000000001',
		},
		maxPlotsReached: {
			message: 'Maximum farm plots reached',
			code: 'MAX_PLOTS_REACHED',
			id: 'a5c01f91-0002-4000-a000-000000000002',
		},
		locationOccupied: {
			message: 'Location is already occupied',
			code: 'LOCATION_OCCUPIED',
			id: 'a5c01f91-0002-4000-a000-000000000003',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		x: { type: 'number' },
		y: { type: 'number' },
		z: { type: 'number' },
		size: { type: 'number', default: 1 },
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

			const result = await this.noctownService.createFarmPlot(
				player.id,
				ps.x,
				ps.y,
				ps.z,
				ps.size,
			);

			if (!result.success) {
				if (result.error === 'MAX_PLOTS_REACHED') {
					throw new ApiError(meta.errors.maxPlotsReached);
				}
				if (result.error === 'LOCATION_OCCUPIED') {
					throw new ApiError(meta.errors.locationOccupied);
				}
			}

			return { success: true, plotId: result.plotId };
		});
	}
}
