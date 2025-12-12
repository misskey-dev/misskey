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
			waterLevel: { type: 'number', optional: true },
		},
	},
	errors: {
		noPlayer: {
			message: 'Player not found',
			code: 'NO_PLAYER',
			id: 'a5c01f91-0004-4000-a000-000000000001',
		},
		cropNotFound: {
			message: 'Crop not found',
			code: 'CROP_NOT_FOUND',
			id: 'a5c01f91-0004-4000-a000-000000000002',
		},
		cropWithered: {
			message: 'Crop has withered',
			code: 'CROP_WITHERED',
			id: 'a5c01f91-0004-4000-a000-000000000003',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		cropId: { type: 'string' },
	},
	required: ['cropId'],
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

			const result = await this.noctownService.waterCrop(
				player.id,
				ps.cropId,
			);

			if (!result.success) {
				if (result.error === 'CROP_NOT_FOUND') {
					throw new ApiError(meta.errors.cropNotFound);
				}
				if (result.error === 'CROP_WITHERED') {
					throw new ApiError(meta.errors.cropWithered);
				}
			}

			return { success: true, waterLevel: result.waterLevel };
		});
	}
}
