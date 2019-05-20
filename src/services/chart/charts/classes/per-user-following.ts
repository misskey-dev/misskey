import autobind from 'autobind-decorator';
import Chart, { Obj, DeepPartial } from '../../core';
import { SchemaType } from '../../../../misc/schema';
import { Followings, Users } from '../../../../models';
import { Not, IsNull } from 'typeorm';
import { User } from '../../../../models/entities/user';
import { name, schema } from '../schemas/per-user-following';

type PerUserFollowingLog = SchemaType<typeof schema>;

export default class PerUserFollowingChart extends Chart<PerUserFollowingLog> {
	constructor() {
		super(name, schema, true);
	}

	@autobind
	protected genNewLog(latest: PerUserFollowingLog): DeepPartial<PerUserFollowingLog> {
		return {
			local: {
				followings: {
					total: latest.local.followings.total,
				},
				followers: {
					total: latest.local.followers.total,
				}
			},
			remote: {
				followings: {
					total: latest.remote.followings.total,
				},
				followers: {
					total: latest.remote.followers.total,
				}
			}
		};
	}

	@autobind
	protected async fetchActual(group: string): Promise<DeepPartial<PerUserFollowingLog>> {
		const [
			localFollowingsCount,
			localFollowersCount,
			remoteFollowingsCount,
			remoteFollowersCount
		] = await Promise.all([
			Followings.count({ followerId: group, followeeHost: null }),
			Followings.count({ followeeId: group, followerHost: null }),
			Followings.count({ followerId: group, followeeHost: Not(IsNull()) }),
			Followings.count({ followeeId: group, followerHost: Not(IsNull()) })
		]);

		return {
			local: {
				followings: {
					total: localFollowingsCount,
				},
				followers: {
					total: localFollowersCount,
				}
			},
			remote: {
				followings: {
					total: remoteFollowingsCount,
				},
				followers: {
					total: remoteFollowersCount,
				}
			}
		};
	}

	@autobind
	public async update(follower: User, followee: User, isFollow: boolean) {
		const update: Obj = {};

		update.total = isFollow ? 1 : -1;

		if (isFollow) {
			update.inc = 1;
		} else {
			update.dec = 1;
		}

		this.inc({
			[Users.isLocalUser(follower) ? 'local' : 'remote']: { followings: update }
		}, follower.id);
		this.inc({
			[Users.isLocalUser(followee) ? 'local' : 'remote']: { followers: update }
		}, followee.id);
	}
}
