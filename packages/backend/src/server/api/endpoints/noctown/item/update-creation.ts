/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type {
	NoctownItemsRepository,
	NoctownPlayersRepository,
	DriveFilesRepository,
} from '@/models/_.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['noctown'],
	requireCredential: true,
	kind: 'write:account',

	errors: {
		playerNotFound: {
			message: 'Player not found.',
			code: 'PLAYER_NOT_FOUND',
			id: 'c1d2e3f4-0020-0001-0001-000000000001',
		},
		itemNotFound: {
			message: 'Item not found.',
			code: 'ITEM_NOT_FOUND',
			id: 'c1d2e3f4-0020-0001-0001-000000000002',
		},
		notYourItem: {
			message: 'This item was not created by you.',
			code: 'NOT_YOUR_ITEM',
			id: 'c1d2e3f4-0020-0001-0001-000000000003',
		},
		invalidImage: {
			message: 'Invalid or inaccessible image file.',
			code: 'INVALID_IMAGE',
			id: 'c1d2e3f4-0020-0001-0001-000000000004',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		itemId: { type: 'string', format: 'misskey:id' },
		name: { type: 'string', minLength: 1, maxLength: 64 },
		flavorText: { type: 'string', maxLength: 500, nullable: true },
		imageFileId: { type: 'string', format: 'misskey:id', nullable: true },
	},
	required: ['itemId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.noctownItemsRepository)
		private noctownItemsRepository: NoctownItemsRepository,

		@Inject(DI.noctownPlayersRepository)
		private noctownPlayersRepository: NoctownPlayersRepository,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			// Get player
			const player = await this.noctownPlayersRepository.findOneBy({ userId: me.id });
			if (!player) {
				throw new ApiError(meta.errors.playerNotFound);
			}

			// Get item
			const item = await this.noctownItemsRepository.findOneBy({ id: ps.itemId });
			if (!item) {
				throw new ApiError(meta.errors.itemNotFound);
			}

			// Check ownership
			if (!item.isPlayerCreated || item.creatorId !== me.id) {
				throw new ApiError(meta.errors.notYourItem);
			}

			// Build update data
			const updateData: Record<string, unknown> = {};

			if (ps.name !== undefined) {
				updateData.name = ps.name;
			}

			if (ps.flavorText !== undefined) {
				updateData.flavorText = ps.flavorText;
			}

			if (ps.imageFileId !== undefined) {
				if (ps.imageFileId === null) {
					updateData.imageUrl = null;
					updateData.fullImageUrl = null;
				} else {
					const file = await this.driveFilesRepository.findOne({
						where: { id: ps.imageFileId, userId: me.id },
					});
					if (!file || !file.type.startsWith('image/')) {
						throw new ApiError(meta.errors.invalidImage);
					}
					updateData.imageUrl = file.url;
					updateData.fullImageUrl = file.url;
				}
			}

			// Update item
			if (Object.keys(updateData).length > 0) {
				await this.noctownItemsRepository.update({ id: ps.itemId }, updateData);
			}

			// Return updated item
			const updatedItem = await this.noctownItemsRepository.findOneBy({ id: ps.itemId });

			return {
				id: updatedItem!.id,
				name: updatedItem!.name,
				flavorText: updatedItem!.flavorText,
				itemType: updatedItem!.itemType,
				imageUrl: updatedItem!.imageUrl,
				fullImageUrl: updatedItem!.fullImageUrl,
			};
		});
	}
}
