/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { FollowRequestsRepository } from '@/models/_.js';
import type { } from '@/models/Blocking.js';
import type { MiUser } from '@/models/User.js';
import type { MiFollowRequest } from '@/models/FollowRequest.js';
import { bindThis } from '@/decorators.js';
import type { Packed } from '@/misc/json-schema.js';
import { UserEntityService } from './UserEntityService.js';

@Injectable()
export class FollowRequestEntityService {
	constructor(
		@Inject(DI.followRequestsRepository)
		private followRequestsRepository: FollowRequestsRepository,

		private userEntityService: UserEntityService,
	) {
	}

	@bindThis
	public async pack(
		src: MiFollowRequest['id'] | MiFollowRequest,
		me?: { id: MiUser['id'] } | null | undefined,
		hint?: {
			packedFollower?: Packed<'UserLite'>,
			packedFollowee?: Packed<'UserLite'>,
		},
	) {
		const request = typeof src === 'object' ? src : await this.followRequestsRepository.findOneByOrFail({ id: src });

		return {
			id: request.id,
			follower: hint?.packedFollower ?? await this.userEntityService.pack(request.followerId, me),
			followee: hint?.packedFollowee ?? await this.userEntityService.pack(request.followeeId, me),
		};
	}

	@bindThis
	public async packMany(
		requests: MiFollowRequest[],
		me?: { id: MiUser['id'] } | null | undefined,
	) {
		const _followers = requests.map(({ follower, followerId }) => follower ?? followerId);
		const _followees = requests.map(({ followee, followeeId }) => followee ?? followeeId);
		const _userMap = await this.userEntityService.packMany([..._followers, ..._followees], me)
			.then(users => new Map(users.map(u => [u.id, u])));
		return Promise.all(
			requests.map(req => {
				const packedFollower = _userMap.get(req.followerId);
				const packedFollowee = _userMap.get(req.followeeId);
				return this.pack(req, me, { packedFollower, packedFollowee });
			}),
		);
	}
}

