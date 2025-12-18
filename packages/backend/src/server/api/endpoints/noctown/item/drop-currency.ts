/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { NoctownService } from '@/core/NoctownService.js';
import type { NoctownPlayersRepository } from '@/models/_.js';
import { ApiError } from '@/server/api/error.js';

// 仕様: ウォレットからノクタコインを地面にドロップするAPIエンドポイント
export const meta = {
	tags: ['noctown'],

	requireCredential: true,
	kind: 'write:account',

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			success: { type: 'boolean' },
			droppedItemId: { type: 'string', nullable: true },
		},
	},

	errors: {
		playerNotFound: {
			message: 'Player not found.',
			code: 'PLAYER_NOT_FOUND',
			id: 'a1b2c3d4-0003-0001-0001-000000000001',
		},
		insufficientBalance: {
			message: 'Insufficient balance.',
			code: 'INSUFFICIENT_BALANCE',
			id: 'a1b2c3d4-0003-0001-0001-000000000002',
		},
		invalidAmount: {
			message: 'Invalid amount.',
			code: 'INVALID_AMOUNT',
			id: 'a1b2c3d4-0003-0001-0001-000000000003',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		amount: { type: 'number', minimum: 1 },
		positionX: { type: 'number' },
		positionY: { type: 'number' },
		positionZ: { type: 'number' },
	},
	required: ['amount', 'positionX', 'positionY', 'positionZ'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.noctownPlayersRepository)
		private noctownPlayersRepository: NoctownPlayersRepository,

		private noctownService: NoctownService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const player = await this.noctownPlayersRepository.findOneBy({ userId: me.id });
			if (!player) {
				throw new ApiError(meta.errors.playerNotFound);
			}

			if (ps.amount <= 0) {
				throw new ApiError(meta.errors.invalidAmount);
			}

			const result = await this.noctownService.dropCurrencyFromWallet(
				player.id,
				ps.amount,
				ps.positionX,
				ps.positionY,
				ps.positionZ,
			);

			if (!result) {
				throw new ApiError(meta.errors.insufficientBalance);
			}

			return {
				success: true,
				droppedItemId: result.droppedItemId,
			};
		});
	}
}
