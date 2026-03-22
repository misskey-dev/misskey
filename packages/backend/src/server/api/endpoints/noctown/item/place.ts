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

export const meta = {
	tags: ['noctown'],

	requireCredential: true,
	kind: 'write:account',

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			success: { type: 'boolean' },
			placedItemId: { type: 'string', nullable: true },
		},
	},

	errors: {
		playerNotFound: {
			message: 'Player not found.',
			code: 'PLAYER_NOT_FOUND',
			id: 'a1b2c3d4-0002-0001-0001-000000000001',
		},
		itemNotOwned: {
			message: 'Item not found in inventory.',
			code: 'ITEM_NOT_FOUND',
			id: 'a1b2c3d4-0002-0001-0001-000000000002',
		},
		// 仕様: FR-032 設置不可アイテムエラー
		itemNotPlaceable: {
			message: 'This item type cannot be placed.',
			code: 'ITEM_NOT_PLACEABLE',
			id: 'a1b2c3d4-0002-0001-0001-000000000003',
		},
		// 仕様: FR-032 設置上限到達エラー
		placementLimitReached: {
			message: 'Placement limit reached (max 100).',
			code: 'PLACEMENT_LIMIT_REACHED',
			id: 'a1b2c3d4-0002-0001-0001-000000000004',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		playerItemId: { type: 'string' },
		x: { type: 'number' },
		y: { type: 'number' },
		z: { type: 'number' },
		rotation: { type: 'number', default: 0 },
	},
	required: ['playerItemId', 'x', 'y', 'z'],
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

			// 仕様: FR-032 placeItem戻り値でエラー種別を判定
			const result = await this.noctownService.placeItem(
				player.id,
				ps.playerItemId,
				ps.x,
				ps.y,
				ps.z,
				ps.rotation ?? 0,
			);

			if (!result.success) {
				if (result.error === 'not_found') {
					throw new ApiError(meta.errors.itemNotOwned);
				} else if (result.error === 'not_placeable') {
					throw new ApiError(meta.errors.itemNotPlaceable);
				} else if (result.error === 'limit_reached') {
					throw new ApiError(meta.errors.placementLimitReached);
				}
				throw new ApiError(meta.errors.itemNotOwned);
			}

			return {
				success: true,
				placedItemId: null,
			};
		});
	}
}
