import autobind from 'autobind-decorator';
import Chart, { Obj, DeepPartial } from '../core';
import { SchemaType } from '@/misc/schema';
import { Followings, Users } from '@/models/index';
import { Not, IsNull } from 'typeorm';
import { User } from '@/models/entities/user';
import { name, schema } from './entities/per-user-following';

type PerUserFollowingLog = SchemaType<typeof schema>;

/**
 * ユーザーごとのフォローに関するチャート
 */
// eslint-disable-next-line import/no-default-export
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
				},
			},
			remote: {
				followings: {
					total: latest.remote.followings.total,
				},
				followers: {
					total: latest.remote.followers.total,
				},
			},
		};
	}

	@autobind
	protected aggregate(logs: PerUserFollowingLog[]): PerUserFollowingLog {
		return {
			local: {
				followings: {
					total: logs[0].local.followings.total,
					inc: logs.reduce((a, b) => a + b.local.followings.inc, 0),
					dec: logs.reduce((a, b) => a + b.local.followings.dec, 0),
				},
				followers: {
					total: logs[0].local.followers.total,
					inc: logs.reduce((a, b) => a + b.local.followers.inc, 0),
					dec: logs.reduce((a, b) => a + b.local.followers.dec, 0),
				},
			},
			remote: {
				followings: {
					total: logs[0].remote.followings.total,
					inc: logs.reduce((a, b) => a + b.remote.followings.inc, 0),
					dec: logs.reduce((a, b) => a + b.remote.followings.dec, 0),
				},
				followers: {
					total: logs[0].remote.followers.total,
					inc: logs.reduce((a, b) => a + b.remote.followers.inc, 0),
					dec: logs.reduce((a, b) => a + b.remote.followers.dec, 0),
				},
			},
		};
	}

	@autobind
	protected async fetchActual(group: string): Promise<DeepPartial<PerUserFollowingLog>> {
		const [
			localFollowingsCount,
			localFollowersCount,
			remoteFollowingsCount,
			remoteFollowersCount,
		] = await Promise.all([
			Followings.count({ followerId: group, followeeHost: null }),
			Followings.count({ followeeId: group, followerHost: null }),
			Followings.count({ followerId: group, followeeHost: Not(IsNull()) }),
			Followings.count({ followeeId: group, followerHost: Not(IsNull()) }),
		]);

		return {
			local: {
				followings: {
					total: localFollowingsCount,
				},
				followers: {
					total: localFollowersCount,
				},
			},
			remote: {
				followings: {
					total: remoteFollowingsCount,
				},
				followers: {
					total: remoteFollowersCount,
				},
			},
		};
	}

	@autobind
	public async update(follower: { id: User['id']; host: User['host']; }, followee: { id: User['id']; host: User['host']; }, isFollow: boolean): Promise<void> {
		const update: Obj = {};

		update.total = isFollow ? 1 : -1;

		if (isFollow) {
			update.inc = 1;
		} else {
			update.dec = 1;
		}

		this.inc({
			[Users.isLocalUser(follower) ? 'local' : 'remote']: { followings: update },
		}, follower.id);
		this.inc({
			[Users.isLocalUser(followee) ? 'local' : 'remote']: { followers: update },
		}, followee.id);
	}
}
