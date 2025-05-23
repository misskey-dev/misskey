/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { ChannelFollowingsRepository, UsersRepository } from '@/models/_.js';
import { QueryService } from '@/core/QueryService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { FollowingEntityService } from '@/core/entities/FollowingEntityService.js'; // 追加
import { DI } from '@/di-symbols.js';
import { GetterService } from '@/server/api/GetterService.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['channels'],

	requireCredential: false,

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'Following',
		},
	},

	errors: {
		noSuchChannel: {
			message: 'No such channel.',
			code: 'NO_SUCH_CHANNEL',
			id: '998e4ab5-e0c9-4b43-b0bd-0bb5f8393cee',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		channelId: { type: 'string', format: 'misskey:id' },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
	},
	required: ['channelId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.channelFollowingsRepository)
		private channelFollowingsRepository: ChannelFollowingsRepository,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private userEntityService: UserEntityService,
		private followingEntityService: FollowingEntityService, // 追加
		private queryService: QueryService,
		private getterService: GetterService,
	) {
		super(meta, paramDef, async (ps, me) => {
			try {
				// Ensure the channel exists
				const channel = await this.getterService.getChannel(ps.channelId).catch(err => {
					throw new ApiError(meta.errors.noSuchChannel);
				});

				const query = this.queryService.makePaginationQuery(
					this.channelFollowingsRepository.createQueryBuilder('following'),
					ps.sinceId,
					ps.untilId,
				)
					.andWhere('following.followeeId = :channelId', { channelId: ps.channelId })
					.innerJoinAndSelect('following.follower', 'follower');

				const followers = await query
					.limit(ps.limit)
					.getMany();

				// users/followers エンドポイントと同様の方法でフォロワー情報をパック
				return await this.followingEntityService.packMany(followers, me, { populateFollower: true });
			} catch (error) {
				// Re-throw API errors, otherwise log the error
				if (error instanceof ApiError) throw error;
				console.error(`Error in channels/followers endpoint: ${error}`);
				throw error;
			}
		});
	}
}
