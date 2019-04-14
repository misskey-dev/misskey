import { EntityRepository, Repository } from 'typeorm';
import { Users } from '..';
import rap from '@prezzemolo/rap';
import { Following } from '../entities/following';
import { ensure } from '../../prelude/ensure';

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

@EntityRepository(Following)
export class FollowingRepository extends Repository<Following> {
	public isLocalFollower(following: Following): following is LocalFollowerFollowing {
		return following.followerHost == null;
	}

	public isRemoteFollower(following: Following): following is RemoteFollowerFollowing {
		return following.followerHost != null;
	}

	public isLocalFollowee(following: Following): following is LocalFolloweeFollowing {
		return following.followeeHost == null;
	}

	public isRemoteFollowee(following: Following): following is RemoteFolloweeFollowing {
		return following.followeeHost != null;
	}

	public packMany(
		followings: any[],
		me?: any,
		opts?: {
			populateFollowee?: boolean;
			populateFollower?: boolean;
		}
	) {
		return Promise.all(followings.map(x => this.pack(x, me, opts)));
	}

	public async pack(
		src: Following['id'] | Following,
		me?: any,
		opts?: {
			populateFollowee?: boolean;
			populateFollower?: boolean;
		}
	) {
		const following = typeof src === 'object' ? src : await this.findOne(src).then(ensure);

		if (opts == null) opts = {};

		return await rap({
			id: following.id,
			createdAt: following.createdAt,
			followeeId: following.followeeId,
			followerId: following.followerId,
			followee: opts.populateFollowee ? Users.pack(following.followee || following.followeeId, me, {
				detail: true
			}) : null,
			follower: opts.populateFollower ? Users.pack(following.follower || following.followerId, me, {
				detail: true
			}) : null,
		});
	}
}
