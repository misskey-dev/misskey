/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type {
	NoctownBulletinBoardsRepository,
	NoctownBulletinPostsRepository,
	NoctownPlayersRepository,
	NoctownPlayerItemsRepository,
} from '@/models/_.js';
import { IdService } from '@/core/IdService.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['noctown'],
	requireCredential: true,
	kind: 'write:account',
	errors: {
		noPlayer: {
			message: 'Player not found.',
			code: 'NO_PLAYER',
			id: 'f2b01f03-0001-0001-0001-000000000001',
		},
		noBoard: {
			message: 'Bulletin board not found.',
			code: 'NO_BOARD',
			id: 'f2b01f03-0001-0001-0002-000000000001',
		},
		contentTooLong: {
			message: 'Content is too long.',
			code: 'CONTENT_TOO_LONG',
			id: 'f2b01f03-0001-0001-0003-000000000001',
		},
		itemNotFound: {
			message: 'Item not found in inventory.',
			code: 'ITEM_NOT_FOUND',
			id: 'f2b01f03-0001-0001-0004-000000000001',
		},
	},
	res: {
		type: 'object',
		properties: {
			post: {
				type: 'object',
				properties: {
					id: { type: 'string' },
					content: { type: 'string' },
					attachedItemId: { type: 'string', nullable: true },
					createdAt: { type: 'string' },
				},
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		boardId: { type: 'string', format: 'misskey:id' },
		content: { type: 'string', minLength: 1, maxLength: 500 },
		attachedItemId: { type: 'string', format: 'misskey:id' },
		expiresInHours: { type: 'integer', minimum: 1, maximum: 168 }, // Max 1 week
	},
	required: ['boardId', 'content'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.noctownPlayersRepository)
		private noctownPlayersRepository: NoctownPlayersRepository,
		@Inject(DI.noctownBulletinBoardsRepository)
		private noctownBulletinBoardsRepository: NoctownBulletinBoardsRepository,
		@Inject(DI.noctownBulletinPostsRepository)
		private noctownBulletinPostsRepository: NoctownBulletinPostsRepository,
		@Inject(DI.noctownPlayerItemsRepository)
		private noctownPlayerItemsRepository: NoctownPlayerItemsRepository,
		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const player = await this.noctownPlayersRepository.findOneBy({ userId: me.id });
			if (!player) {
				throw new ApiError(meta.errors.noPlayer);
			}

			const board = await this.noctownBulletinBoardsRepository.findOneBy({ id: ps.boardId });
			if (!board) {
				throw new ApiError(meta.errors.noBoard);
			}

			if (ps.content.length > 500) {
				throw new ApiError(meta.errors.contentTooLong);
			}

			// Validate attached item if provided
			let attachedItemId: string | null = null;
			if (ps.attachedItemId) {
				const playerItem = await this.noctownPlayerItemsRepository.findOne({
					where: { id: ps.attachedItemId, playerId: player.id },
				});
				if (!playerItem) {
					throw new ApiError(meta.errors.itemNotFound);
				}
				attachedItemId = playerItem.itemId;
			}

			// Calculate expiration date
			let expiresAt: Date | null = null;
			if (ps.expiresInHours) {
				expiresAt = new Date(Date.now() + ps.expiresInHours * 60 * 60 * 1000);
			}

			const post = await this.noctownBulletinPostsRepository.insertOne({
				id: this.idService.gen(),
				boardId: ps.boardId,
				playerId: player.id,
				content: ps.content,
				attachedItemId,
				expiresAt,
			});

			return {
				post: {
					id: post.id,
					content: post.content,
					attachedItemId: post.attachedItemId,
					createdAt: post.createdAt.toISOString(),
				},
			};
		});
	}
}
