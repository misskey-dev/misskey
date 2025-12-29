/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type { NoctownPlacedItemsRepository, NoctownItemsRepository, NoctownPlayersRepository, UsersRepository } from '@/models/_.js';

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
				// FR-032: 設置者のプレイヤーIDを追加（回収権限判定用）
				// 仕様: nullの場合は「不明」として表示
				ownerId: { type: 'string', nullable: true },
				ownerUsername: { type: 'string', nullable: true },
				positionX: { type: 'number' },
				positionY: { type: 'number' },
				positionZ: { type: 'number' },
				rotation: { type: 'number' },
				placedAt: { type: 'string', format: 'date-time' },
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
		@Inject(DI.noctownPlacedItemsRepository)
		private noctownPlacedItemsRepository: NoctownPlacedItemsRepository,

		@Inject(DI.noctownItemsRepository)
		private noctownItemsRepository: NoctownItemsRepository,

		@Inject(DI.noctownPlayersRepository)
		private noctownPlayersRepository: NoctownPlayersRepository,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			const radius = Math.min(ps.radius ?? 30, 50);

			// Get placed items in range
			const placedItems = await this.noctownPlacedItemsRepository
				.createQueryBuilder('pi')
				.where('pi."positionX" BETWEEN :minX AND :maxX', {
					minX: ps.x - radius,
					maxX: ps.x + radius,
				})
				.andWhere('pi."positionZ" BETWEEN :minZ AND :maxZ', {
					minZ: ps.z - radius,
					maxZ: ps.z + radius,
				})
				.orderBy('pi."placedAt"', 'DESC')
				.limit(100)
				.getMany();

			const results = await Promise.all(
				placedItems.map(async (pi) => {
					const item = await this.noctownItemsRepository.findOneBy({ id: pi.itemId });

					// 仕様: playerIdがnullの場合は設置者を「不明」として扱う
					let ownerUsername: string | null = null;
					if (pi.playerId) {
						const player = await this.noctownPlayersRepository.findOneBy({ id: pi.playerId });
						if (player) {
							const user = await this.usersRepository.findOneBy({ id: player.userId });
							ownerUsername = user?.username ?? null;
						}
					}

					return {
						id: pi.id,
						itemId: pi.itemId,
						itemName: item?.name ?? 'Unknown',
						itemType: item?.itemType ?? 'normal',
						// FR-032: 設置者のプレイヤーIDを追加（回収権限判定用）
						// 仕様: nullの場合は「不明」として表示
						ownerId: pi.playerId,
						ownerUsername,
						positionX: pi.positionX,
						positionY: pi.positionY,
						positionZ: pi.positionZ,
						rotation: pi.rotation,
						placedAt: pi.placedAt.toISOString(),
					};
				}),
			);

			return results;
		});
	}
}
