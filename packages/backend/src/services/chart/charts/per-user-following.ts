import autobind from 'autobind-decorator';
import Chart, { KVs } from '../core';
import { Followings, Users } from '@/models/index';
import { Not, IsNull } from 'typeorm';
import { User } from '@/models/entities/user';
import { name, schema } from './entities/per-user-following';

/**
 * ユーザーごとのフォローに関するチャート
 */
// eslint-disable-next-line import/no-default-export
export default class PerUserFollowingChart extends Chart<typeof schema> {
	constructor() {
		super(name, schema, true);
	}

	@autobind
	protected async queryCurrentState(group: string): Promise<Partial<KVs<typeof schema>>> {
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
