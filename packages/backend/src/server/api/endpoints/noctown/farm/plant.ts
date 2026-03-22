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
			cropId: { type: 'string', optional: true },
		},
	},
	errors: {
		noPlayer: {
			message: 'Player not found',
			code: 'NO_PLAYER',
			id: 'a5c01f91-0003-4000-a000-000000000001',
		},
		plotNotFound: {
			message: 'Farm plot not found',
			code: 'PLOT_NOT_FOUND',
			id: 'a5c01f91-0003-4000-a000-000000000002',
		},
		plotHasCrop: {
			message: 'Plot already has a crop',
			code: 'PLOT_HAS_CROP',
			id: 'a5c01f91-0003-4000-a000-000000000003',
		},
		seedNotFound: {
			message: 'Seed item not found',
			code: 'SEED_NOT_FOUND',
			id: 'a5c01f91-0003-4000-a000-000000000004',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		plotId: { type: 'string' },
		seedItemId: { type: 'string' },
	},
	required: ['plotId', 'seedItemId'],
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

			const result = await this.noctownService.plantCrop(
				player.id,
				ps.plotId,
				ps.seedItemId,
			);

			if (!result.success) {
				if (result.error === 'PLOT_NOT_FOUND') {
					throw new ApiError(meta.errors.plotNotFound);
				}
				if (result.error === 'PLOT_HAS_CROP') {
					throw new ApiError(meta.errors.plotHasCrop);
				}
				if (result.error === 'SEED_NOT_FOUND') {
					throw new ApiError(meta.errors.seedNotFound);
				}
			}

			return { success: true, cropId: result.cropId };
		});
	}
}
