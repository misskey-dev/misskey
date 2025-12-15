/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type { NoctownDroppedItemsRepository, NoctownItemsRepository } from '@/models/_.js';

// 仕様: FR-030 ドロップアイテムの絵文字表現と拾得システム
// 範囲内のドロップアイテム一覧を取得
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
				emoji: { type: 'string', nullable: true },
				imageUrl: { type: 'string', nullable: true },
				rarity: { type: 'number' },
				quantity: { type: 'number' },
				positionX: { type: 'number' },
				positionY: { type: 'number' },
				positionZ: { type: 'number' },
				droppedAt: { type: 'string', format: 'date-time' },
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		x: { type: 'number' },
		z: { type: 'number' },
		radius: { type: 'number', default: 30 },
	},
	required: ['x', 'z'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.noctownDroppedItemsRepository)
		private noctownDroppedItemsRepository: NoctownDroppedItemsRepository,

		@Inject(DI.noctownItemsRepository)
		private noctownItemsRepository: NoctownItemsRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			const radius = Math.min(ps.radius ?? 30, 50);

			// Get dropped items in range
			const droppedItems = await this.noctownDroppedItemsRepository
				.createQueryBuilder('di')
				.where('di."positionX" BETWEEN :minX AND :maxX', {
					minX: ps.x - radius,
					maxX: ps.x + radius,
				})
				.andWhere('di."positionZ" BETWEEN :minZ AND :maxZ', {
					minZ: ps.z - radius,
					maxZ: ps.z + radius,
				})
				.orderBy('di."droppedAt"', 'DESC')
				.limit(50)
				.getMany();

			const results = await Promise.all(
				droppedItems.map(async (di) => {
					const item = await this.noctownItemsRepository.findOneBy({ id: di.itemId });
					return {
						id: di.id,
						itemId: di.itemId,
						itemName: item?.name ?? 'Unknown',
						itemType: item?.itemType ?? 'normal',
						// 仕様: FR-030 画像がない場合はemoji、両方ない場合は📦をデフォルト表示
						emoji: item?.emoji ?? null,
						imageUrl: item?.imageUrl ?? null,
						rarity: item?.rarity ?? 0,
						quantity: di.quantity ?? 1,
						positionX: di.positionX,
						positionY: di.positionY,
						positionZ: di.positionZ,
						droppedAt: di.droppedAt.toISOString(),
					};
				}),
			);

			return results;
		});
	}
}
