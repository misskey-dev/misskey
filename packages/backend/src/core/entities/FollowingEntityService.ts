/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { FollowingsRepository } from '@/models/_.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import type { Packed } from '@/misc/json-schema.js';
import type { } from '@/models/Blocking.js';
import type { MiUser } from '@/models/User.js';
import type { MiFollowing } from '@/models/Following.js';
import { bindThis } from '@/decorators.js';
import { IdService } from '@/core/IdService.js';
import { UserEntityService } from './UserEntityService.js';

type LocalFollowerFollowing = MiFollowing & {
	followerHost: null;
	followerInbox: null;
	followerSharedInbox: null;
};

type RemoteFollowerFollowing = MiFollowing & {
	followerHost: string;
	followerInbox: string;
	followerSharedInbox: string;
};

type LocalFolloweeFollowing = MiFollowing & {
	followeeHost: null;
	followeeInbox: null;
	followeeSharedInbox: null;
};

type RemoteFolloweeFollowing = MiFollowing & {
	followeeHost: string;
	followeeInbox: string;
	followeeSharedInbox: string;
};

@Injectable()
export class FollowingEntityService {
	constructor(
		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		private userEntityService: UserEntityService,
		private idService: IdService,
	) {
	}

	@bindThis
	public isLocalFollower(following: MiFollowing): following is LocalFollowerFollowing {
		return following.followerHost == null;
	}

	@bindThis
	public isRemoteFollower(following: MiFollowing): following is RemoteFollowerFollowing {
		return following.followerHost != null;
	}

	@bindThis
	public isLocalFollowee(following: MiFollowing): following is LocalFolloweeFollowing {
		return following.followeeHost == null;
	}

	@bindThis
	public isRemoteFollowee(following: MiFollowing): following is RemoteFolloweeFollowing {
		return following.followeeHost != null;
	}

	@bindThis
	public async pack(
		src: MiFollowing['id'] | MiFollowing,
		me?: { id: MiUser['id'] } | null | undefined,
		opts?: {
			populateFollowee?: boolean;
			populateFollower?: boolean;
		},
		hint?: {
			packedFollowee?: Packed<'UserDetailedNotMe'>,
			packedFollower?: Packed<'UserDetailedNotMe'>,
		},
	): Promise<Packed<'Following'>> {
		const following = typeof src === 'object' ? src : await this.followingsRepository.findOneByOrFail({ id: src });

		if (opts == null) opts = {};

		return await awaitAll({
			id: following.id,
			createdAt: this.idService.parse(following.id).date.toISOString(),
			followeeId: following.followeeId,
			followerId: following.followerId,
			followee: opts.populateFollowee ? hint?.packedFollowee ?? this.userEntityService.pack(following.followee ?? following.followeeId, me, {
				schema: 'UserDetailedNotMe',
			}) : undefined,
			follower: opts.populateFollower ? hint?.packedFollower ?? this.userEntityService.pack(following.follower ?? following.followerId, me, {
				schema: 'UserDetailedNotMe',
			}) : undefined,
		});
	}

	@bindThis
	public async packMany(
		followings: MiFollowing[],
		me?: { id: MiUser['id'] } | null | undefined,
		opts?: {
			populateFollowee?: boolean;
			populateFollower?: boolean;
		},
	) {
		const _followees = opts?.populateFollowee ? followings.map(({ followee, followeeId }) => followee ?? followeeId) : [];
		const _followers = opts?.populateFollower ? followings.map(({ follower, followerId }) => follower ?? followerId) : [];
		const _userMap = await this.userEntityService.packMany([..._followees, ..._followers], me, { schema: 'UserDetailedNotMe' })
			.then(users => new Map(users.map(u => [u.id, u])));
		return Promise.all(
			followings.map(following => {
				const packedFollowee = opts?.populateFollowee ? _userMap.get(following.followeeId) : undefined;
				const packedFollower = opts?.populateFollower ? _userMap.get(following.followerId) : undefined;
				return this.pack(following, me, opts, { packedFollowee, packedFollower });
			}),
		);
	}
}

