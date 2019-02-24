import autobind from 'autobind-decorator';
import Chart, { Obj } from './';
import Following from '../../models/following';
import { IUser, isLocalUser } from '../../models/user';
import { SchemaType } from '../../misc/schema';

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

class PerUserFollowingChart extends Chart<PerUserFollowingLog> {
	constructor() {
		super('perUserFollowing', true);
	}

	@autobind
	protected async getTemplate(init: boolean, latest?: PerUserFollowingLog, group?: any): Promise<PerUserFollowingLog> {
		const [
			localFollowingsCount,
			localFollowersCount,
			remoteFollowingsCount,
			remoteFollowersCount
		] = init ? await Promise.all([
			Following.count({ followerId: group, '_followee.host': null }),
			Following.count({ followeeId: group, '_follower.host': null }),
			Following.count({ followerId: group, '_followee.host': { $ne: null } }),
			Following.count({ followeeId: group, '_follower.host': { $ne: null } })
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
	public async update(follower: IUser, followee: IUser, isFollow: boolean) {
		const update: Obj = {};

		update.total = isFollow ? 1 : -1;

		if (isFollow) {
			update.inc = 1;
		} else {
			update.dec = 1;
		}

		this.inc({
			[isLocalUser(follower) ? 'local' : 'remote']: { followings: update }
		}, follower._id);
		this.inc({
			[isLocalUser(followee) ? 'local' : 'remote']: { followers: update }
		}, followee._id);
	}
}

export default new PerUserFollowingChart();
