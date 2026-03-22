/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type {
	NoctownBulletinPostsRepository,
	NoctownBulletinLikesRepository,
	NoctownPlayersRepository,
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
			id: 'f2b01f06-0001-0001-0001-000000000001',
		},
		noPost: {
			message: 'Post not found.',
			code: 'NO_POST',
			id: 'f2b01f06-0001-0001-0002-000000000001',
		},
		notLiked: {
			message: 'You have not liked this post.',
			code: 'NOT_LIKED',
			id: 'f2b01f06-0001-0001-0003-000000000001',
		},
	},
	res: {
		type: 'object',
		properties: {
			likeCount: { type: 'number' },
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		postId: { type: 'string', format: 'misskey:id' },
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
		@Inject(DI.noctownBulletinLikesRepository)
		private noctownBulletinLikesRepository: NoctownBulletinLikesRepository,
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

			// Check if liked
			const existingLike = await this.noctownBulletinLikesRepository.findOneBy({
				postId: ps.postId,
				playerId: player.id,
			});

			if (!existingLike) {
				throw new ApiError(meta.errors.notLiked);
			}

			// Remove like
			await this.noctownBulletinLikesRepository.delete({
				postId: ps.postId,
				playerId: player.id,
			});

			// Update like count
			await this.noctownBulletinPostsRepository.decrement({ id: ps.postId }, 'likeCount', 1);

			const updatedPost = await this.noctownBulletinPostsRepository.findOneBy({ id: ps.postId });

			return {
				likeCount: Math.max(0, updatedPost?.likeCount ?? post.likeCount - 1),
			};
		});
	}
}
