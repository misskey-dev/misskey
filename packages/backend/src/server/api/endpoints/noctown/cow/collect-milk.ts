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
			id: 'a5c01f91-0013-4000-a000-000000000001',
		},
		cowNotFound: {
			message: 'Cow not found',
			code: 'COW_NOT_FOUND',
			id: 'a5c01f91-0013-4000-a000-000000000002',
		},
		noMilkReady: {
			message: 'No milk ready to collect',
			code: 'NO_MILK_READY',
			id: 'a5c01f91-0013-4000-a000-000000000003',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		cowId: { type: 'string' },
	},
	required: ['cowId'],
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

			const result = await this.noctownService.collectMilk(
				player.id,
				ps.cowId,
			);

			if (!result.success) {
				if (result.error === 'COW_NOT_FOUND') {
					throw new ApiError(meta.errors.cowNotFound);
				}
				if (result.error === 'NO_MILK_READY') {
					throw new ApiError(meta.errors.noMilkReady);
				}
			}

			return { success: true, quantity: result.quantity };
		});
	}
}
