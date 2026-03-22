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
	NoctownBulletinLikesRepository,
	NoctownPlayersRepository,
	UsersRepository,
} from '@/models/_.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['noctown'],
	requireCredential: true,
	kind: 'read:account',
	errors: {
		noPlayer: {
			message: 'Player not found.',
			code: 'NO_PLAYER',
			id: 'f2b01f02-0001-0001-0001-000000000001',
		},
		noBoard: {
			message: 'Bulletin board not found.',
			code: 'NO_BOARD',
			id: 'f2b01f02-0001-0001-0002-000000000001',
		},
	},
	res: {
		type: 'object',
		properties: {
			posts: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						id: { type: 'string' },
						content: { type: 'string' },
						playerId: { type: 'string' },
						playerName: { type: 'string' },
						avatarUrl: { type: 'string', nullable: true },
						attachedItemId: { type: 'string', nullable: true },
						likeCount: { type: 'number' },
						isLiked: { type: 'boolean' },
						isPinned: { type: 'boolean' },
						createdAt: { type: 'string' },
					},
				},
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		boardId: { type: 'string', format: 'misskey:id' },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
	},
	required: ['boardId'],
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
		@Inject(DI.noctownBulletinLikesRepository)
		private noctownBulletinLikesRepository: NoctownBulletinLikesRepository,
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,
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

			const query = this.noctownBulletinPostsRepository
				.createQueryBuilder('post')
				.where('post.boardId = :boardId', { boardId: ps.boardId })
				.andWhere('(post.expiresAt IS NULL OR post.expiresAt > NOW())')
				.orderBy('post.isPinned', 'DESC')
				.addOrderBy('post.createdAt', 'DESC')
				.take(ps.limit);

			if (ps.sinceId) {
				query.andWhere('post.id > :sinceId', { sinceId: ps.sinceId });
			}
			if (ps.untilId) {
				query.andWhere('post.id < :untilId', { untilId: ps.untilId });
			}

			const posts = await query.getMany();

			// Get all player info and like status
			const playerIds = [...new Set(posts.map(p => p.playerId))];
			const players = await this.noctownPlayersRepository.find({
				where: playerIds.map(id => ({ id })),
			});
			const playerMap = new Map(players.map(p => [p.id, p]));

			// Get user avatars
			const userIds = players.map(p => p.userId);
			const users = await this.usersRepository.find({
				where: userIds.map(id => ({ id })),
			});
			const userMap = new Map(users.map(u => [u.id, u]));

			// Check likes
			const postIds = posts.map(p => p.id);
			const myLikes = await this.noctownBulletinLikesRepository.find({
				where: postIds.map(postId => ({ postId, playerId: player.id })),
			});
			const likedPostIds = new Set(myLikes.map(l => l.postId));

			return {
				posts: posts.map(post => {
					const postPlayer = playerMap.get(post.playerId);
					const user = postPlayer ? userMap.get(postPlayer.userId) : null;
					return {
						id: post.id,
						content: post.content,
						playerId: post.playerId,
						playerName: user?.name ?? user?.username ?? 'Unknown',
						avatarUrl: user?.avatarUrl ?? null,
						attachedItemId: post.attachedItemId,
						likeCount: post.likeCount,
						isLiked: likedPostIds.has(post.id),
						isPinned: post.isPinned,
						createdAt: post.createdAt.toISOString(),
					};
				}),
			};
		});
	}
}
