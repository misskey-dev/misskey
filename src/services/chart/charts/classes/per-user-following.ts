import autobind from 'autobind-decorator';
import Chart, { Obj } from '../../core';
import { SchemaType } from '../../../../misc/schema';
import { Followings, Users } from '../../../../models';
import { Not } from 'typeorm';
import { User } from '../../../../models/entities/user';
import { name, schema } from '../schemas/per-user-following';

type PerUserFollowingLog = SchemaType<typeof schema>;

export default class PerUserFollowingChart extends Chart<PerUserFollowingLog> {
	constructor() {
		super(name, schema, true);
	}

	@autobind
	protected async getTemplate(init: boolean, latest?: PerUserFollowingLog, group?: string): Promise<PerUserFollowingLog> {
		const [
			localFollowingsCount,
			localFollowersCount,
			remoteFollowingsCount,
			remoteFollowersCount
		] = init ? await Promise.all([
			Followings.count({ followerId: group, followeeHost: null }),
			Followings.count({ followeeId: group, followerHost: null }),
			Followings.count({ followerId: group, followeeHost: Not(null) }),
			Followings.count({ followeeId: group, followerHost: Not(null) })
		]) : [
			latest ? latest.local.followings.total : 0,
			latest ? latest.local.followers.total : 0,
			latest ? latest.remote.followings.total : 0,
			latest ? latest.remote.followers.total : 0
		];

		return {
			local: {
				followings: {
					total: localFollowingsCount,
					inc: 0,
					dec: 0
				},
				followers: {
					total: localFollowersCount,
					inc: 0,
					dec: 0
				}
			},
			remote: {
				followings: {
					total: remoteFollowingsCount,
					inc: 0,
					dec: 0
				},
				followers: {
					total: remoteFollowersCount,
					inc: 0,
					dec: 0
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
