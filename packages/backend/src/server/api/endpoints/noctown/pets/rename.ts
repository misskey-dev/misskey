/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * ペット名前変更API
 * - 自分が所有するペットのみ名前変更可能
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
			name: { type: 'string' },
		},
	},
	errors: {
		noPlayer: {
			message: 'Player not found',
			code: 'NO_PLAYER',
			id: 'a5c01f91-0014-4005-a000-000000000001',
		},
		petNotFound: {
			message: 'Pet not found or not owned by you',
			code: 'PET_NOT_FOUND',
			id: 'a5c01f91-0014-4005-a000-000000000002',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		petId: { type: 'string' },
		name: { type: 'string', maxLength: 64 },
	},
	required: ['petId', 'name'],
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

			const success = await this.noctownService.renamePet(player.id, ps.petId, ps.name);
			if (!success) {
				throw new ApiError(meta.errors.petNotFound);
			}

			return { success: true, name: ps.name };
		});
	}
}
