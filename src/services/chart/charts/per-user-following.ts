import autobind from 'autobind-decorator';
import Chart, { Obj } from '../core';
import { SchemaType } from '../../../misc/schema';
import { Followings, Users } from '../../../models';
import { Not } from 'typeorm';
import { User } from '../../../models/entities/user';

export const logSchema = {
	/**
	 * フォローしている
	 */
	followings: {
		type: 'object' as 'object',
		properties: {
			/**
			 * フォローしている合計
			 */
			total: {
				type: 'number',
				description: 'フォローしている合計',
			},

			/**
			 * フォローした数
			 */
			inc: {
				type: 'number',
				description: 'フォローした数',
			},

			/**
			 * フォロー解除した数
			 */
			dec: {
				type: 'number',
				description: 'フォロー解除した数',
			},
		}
	},

	/**
	 * フォローされている
	 */
	followers: {
		type: 'object' as 'object',
		properties: {
			/**
			 * フォローされている合計
			 */
			total: {
				type: 'number',
				description: 'フォローされている合計',
			},

			/**
			 * フォローされた数
			 */
			inc: {
				type: 'number',
				description: 'フォローされた数',
			},

			/**
			 * フォロー解除された数
			 */
			dec: {
				type: 'number',
				description: 'フォロー解除された数',
			},
		}
	},
};

export const perUserFollowingLogSchema = {
	type: 'object' as 'object',
	properties: {
		local: {
			type: 'object' as 'object',
			properties: logSchema
		},
		remote: {
			type: 'object' as 'object',
			properties: logSchema
		},
	}
};

type PerUserFollowingLog = SchemaType<typeof perUserFollowingLogSchema>;

export default class PerUserFollowingChart extends Chart<PerUserFollowingLog> {
	constructor() {
		super('perUserFollowing', perUserFollowingLogSchema, true);
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
