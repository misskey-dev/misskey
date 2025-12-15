/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type { NoctownPlayersRepository, NoctownPlayerItemsRepository, NoctownItemsRepository } from '@/models/_.js';

export const meta = {
	tags: ['noctown'],

	requireCredential: true,
	kind: 'read:account',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			properties: {
				id: { type: 'string' },
				itemId: { type: 'string' },
				itemName: { type: 'string' },
				itemType: { type: 'string' },
				imageUrl: { type: 'string', nullable: true },
				// 仕様: FR-030 画像がない場合のUnicode絵文字
				emoji: { type: 'string', nullable: true },
				rarity: { type: 'number' },
				quantity: { type: 'number' },
				acquiredAt: { type: 'string', format: 'date-time' },
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.noctownPlayersRepository)
		private noctownPlayersRepository: NoctownPlayersRepository,

		@Inject(DI.noctownPlayerItemsRepository)
		private noctownPlayerItemsRepository: NoctownPlayerItemsRepository,

		@Inject(DI.noctownItemsRepository)
		private noctownItemsRepository: NoctownItemsRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			const player = await this.noctownPlayersRepository.findOneBy({ userId: me.id });
			if (!player) {
				return [];
			}

			const playerItems = await this.noctownPlayerItemsRepository.find({
				where: { playerId: player.id },
				order: { acquiredAt: 'DESC' },
			});

			const results = await Promise.all(
				playerItems.map(async (pi) => {
					const item = await this.noctownItemsRepository.findOneBy({ id: pi.itemId });
					return {
						id: pi.id,
						itemId: pi.itemId,
						itemName: item?.name ?? 'Unknown',
						itemType: item?.itemType ?? 'normal',
						imageUrl: item?.imageUrl ?? null,
						// 仕様: FR-030 画像がない場合のUnicode絵文字
						emoji: item?.emoji ?? null,
						rarity: item?.rarity ?? 0,
						quantity: pi.quantity,
						acquiredAt: pi.acquiredAt.toISOString(),
					};
				}),
			);

			return results;
		});
	}
}
