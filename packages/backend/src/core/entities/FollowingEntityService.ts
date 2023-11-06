/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
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
	): Promise<Packed<'Following'>> {
		const following = typeof src === 'object' ? src : await this.followingsRepository.findOneByOrFail({ id: src });

		if (opts == null) opts = {};

		return await awaitAll({
			id: following.id,
			createdAt: this.idService.parse(following.id).date.toISOString(),
			followeeId: following.followeeId,
			followerId: following.followerId,
			followee: opts.populateFollowee ? this.userEntityService.pack(following.followee ?? following.followeeId, me, {
				detail: true,
			}) : undefined,
			follower: opts.populateFollower ? this.userEntityService.pack(following.follower ?? following.followerId, me, {
				detail: true,
			}) : undefined,
		});
	}

	@bindThis
	public packMany(
		followings: any[],
		me?: { id: MiUser['id'] } | null | undefined,
		opts?: {
			populateFollowee?: boolean;
			populateFollower?: boolean;
		},
	) {
		return Promise.all(followings.map(x => this.pack(x, me, opts)));
	}
}

