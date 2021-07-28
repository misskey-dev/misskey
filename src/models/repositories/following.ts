import { EntityRepository, Repository } from 'typeorm';
import { Users } from '..';
import { Following } from '../entities/following';
import { awaitAll } from '../../prelude/await-all';
import { SchemaType } from '@/misc/schema';
import { User } from '../entities/user';

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

export type PackedFollowing = SchemaType<typeof packedFollowingSchema>;

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

	public async pack(
		src: Following['id'] | Following,
		me?: { id: User['id'] } | null | undefined,
		opts?: {
			populateFollowee?: boolean;
			populateFollower?: boolean;
		}
	): Promise<PackedFollowing> {
		const following = typeof src === 'object' ? src : await this.findOneOrFail(src);

		if (opts == null) opts = {};

		return await awaitAll({
			id: following.id,
			createdAt: following.createdAt.toISOString(),
			followeeId: following.followeeId,
			followerId: following.followerId,
			followee: opts.populateFollowee ? Users.pack(following.followee || following.followeeId, me, {
				detail: true
			}) : undefined,
			follower: opts.populateFollower ? Users.pack(following.follower || following.followerId, me, {
				detail: true
			}) : undefined,
		});
	}

	public packMany(
		followings: any[],
		me?: { id: User['id'] } | null | undefined,
		opts?: {
			populateFollowee?: boolean;
			populateFollower?: boolean;
		}
	) {
		return Promise.all(followings.map(x => this.pack(x, me, opts)));
	}
}

export const packedFollowingSchema = {
	type: 'object' as const,
	optional: false as const, nullable: false as const,
	properties: {
		id: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		createdAt: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'date-time',
		},
		followeeId: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'id',
		},
		followee: {
			type: 'object' as const,
			optional: true as const, nullable: false as const,
			ref: 'User',
		},
		followerId: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'id',
		},
		follower: {
			type: 'object' as const,
			optional: true as const, nullable: false as const,
			ref: 'User',
		},
	}
};
