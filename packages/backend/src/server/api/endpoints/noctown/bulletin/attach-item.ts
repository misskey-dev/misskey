/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type {
	NoctownBulletinPostsRepository,
	NoctownPlayersRepository,
	NoctownPlayerItemsRepository,
} from '@/models/_.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['noctown'],
	requireCredential: true,
	kind: 'write:account',
	errors: {
		noPlayer: {
			message: 'Player not found.',
			code: 'NO_PLAYER',
			id: 'f2b01f07-0001-0001-0001-000000000001',
		},
		noPost: {
			message: 'Post not found.',
			code: 'NO_POST',
			id: 'f2b01f07-0001-0001-0002-000000000001',
		},
		notAuthor: {
			message: 'You are not the author of this post.',
			code: 'NOT_AUTHOR',
			id: 'f2b01f07-0001-0001-0003-000000000001',
		},
		itemNotFound: {
			message: 'Item not found in inventory.',
			code: 'ITEM_NOT_FOUND',
			id: 'f2b01f07-0001-0001-0004-000000000001',
		},
	},
	res: {
		type: 'object',
		properties: {
			attachedItemId: { type: 'string', nullable: true },
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		postId: { type: 'string', format: 'misskey:id' },
		playerItemId: { type: 'string', format: 'misskey:id' },
	},
	required: ['postId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.noctownPlayersRepository)
		private noctownPlayersRepository: NoctownPlayersRepository,
		@Inject(DI.noctownBulletinPostsRepository)
		private noctownBulletinPostsRepository: NoctownBulletinPostsRepository,
		@Inject(DI.noctownPlayerItemsRepository)
		private noctownPlayerItemsRepository: NoctownPlayerItemsRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			const player = await this.noctownPlayersRepository.findOneBy({ userId: me.id });
			if (!player) {
				throw new ApiError(meta.errors.noPlayer);
			}

			const post = await this.noctownBulletinPostsRepository.findOneBy({ id: ps.postId });
			if (!post) {
				throw new ApiError(meta.errors.noPost);
			}

			if (post.playerId !== player.id) {
				throw new ApiError(meta.errors.notAuthor);
			}

			let attachedItemId: string | null = null;

			// If playerItemId is provided, attach the item
			if (ps.playerItemId) {
				const playerItem = await this.noctownPlayerItemsRepository.findOne({
					where: { id: ps.playerItemId, playerId: player.id },
				});
				if (!playerItem) {
					throw new ApiError(meta.errors.itemNotFound);
				}
				attachedItemId = playerItem.itemId;
			}

			// Update post with attached item (or remove if null)
			await this.noctownBulletinPostsRepository.update(
				{ id: ps.postId },
				{ attachedItemId },
			);

			return {
				attachedItemId,
			};
		});
	}
}
