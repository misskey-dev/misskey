import autobind from 'autobind-decorator';
import Chart, { Obj } from './';
import Following from '../../models/following';
import { IUser, isLocalUser } from '../../models/user';

/**
 * ユーザーごとのフォローに関するチャート
 */
type PerUserFollowingLog = {
	local: {
		/**
		 * フォローしている
		 */
		followings: {
			/**
			 * 合計
			 */
			total: number;

			/**
			 * フォローした数
			 */
			inc: number;

			/**
			 * フォロー解除した数
			 */
			dec: number;
		};

		/**
		 * フォローされている
		 */
		followers: {
			/**
			 * 合計
			 */
			total: number;

			/**
			 * フォローされた数
			 */
			inc: number;

			/**
			 * フォロー解除された数
			 */
			dec: number;
		};
	};

	remote: PerUserFollowingLog['local'];
};

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
