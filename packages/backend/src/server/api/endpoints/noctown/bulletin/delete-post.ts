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
			id: 'f2b01f04-0001-0001-0001-000000000001',
		},
		noPost: {
			message: 'Post not found.',
			code: 'NO_POST',
			id: 'f2b01f04-0001-0001-0002-000000000001',
		},
		notAuthor: {
			message: 'You are not the author of this post.',
			code: 'NOT_AUTHOR',
			id: 'f2b01f04-0001-0001-0003-000000000001',
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

			await this.noctownBulletinPostsRepository.delete({ id: ps.postId });

			return {};
		});
	}
}
