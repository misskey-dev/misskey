import { db } from '@/db/postgre.js';
import { Users } from '../index.js';
import { Following } from '@/models/entities/following.js';
import { awaitAll } from '@/prelude/await-all.js';
import { Packed } from '@/misc/schema.js';
import { User } from '@/models/entities/user.js';

type LocalFollowerFollowing = Following & {
	followerHost: null;
	followerInbox: null;
	followerSharedInbox: null;
};

type RemoteFollowerFollowing = Following & {
	followerHost: string;
	followerInbox: string;
	followerSharedInbox: string;
};

type LocalFolloweeFollowing = Following & {
	followeeHost: null;
	followeeInbox: null;
	followeeSharedInbox: null;
};

type RemoteFolloweeFollowing = Following & {
	followeeHost: string;
	followeeInbox: string;
	followeeSharedInbox: string;
};

export const FollowingRepository = db.getRepository(Following).extend({
	isLocalFollower(following: Following): following is LocalFollowerFollowing {
		return following.followerHost == null;
	},

	isRemoteFollower(following: Following): following is RemoteFollowerFollowing {
		return following.followerHost != null;
	},

	isLocalFollowee(following: Following): following is LocalFolloweeFollowing {
		return following.followeeHost == null;
	},

	isRemoteFollowee(following: Following): following is RemoteFolloweeFollowing {
		return following.followeeHost != null;
	},

	async pack(
		src: Following['id'] | Following,
		me?: { id: User['id'] } | null | undefined,
		opts?: {
			populateFollowee?: boolean;
			populateFollower?: boolean;
		}
	): Promise<Packed<'Following'>> {
		const following = typeof src === 'object' ? src : await this.findOneByOrFail({ id: src });

		if (opts == null) opts = {};

		return await awaitAll({
			id: following.id,
			createdAt: following.createdAt.toISOString(),
			followeeId: following.followeeId,
			followerId: following.followerId,
			followee: opts.populateFollowee ? Users.pack(following.followee || following.followeeId, me, {
				detail: true,
			}) : undefined,
			follower: opts.populateFollower ? Users.pack(following.follower || following.followerId, me, {
				detail: true,
			}) : undefined,
		});
	},

	packMany(
		followings: any[],
		me?: { id: User['id'] } | null | undefined,
		opts?: {
			populateFollowee?: boolean;
			populateFollower?: boolean;
		}
	) {
		return Promise.all(followings.map(x => this.pack(x, me, opts)));
	},
});
