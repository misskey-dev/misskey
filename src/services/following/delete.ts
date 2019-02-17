import User, { isLocalUser, isRemoteUser, pack as packUser, IUser } from '../../models/user';
import Following from '../../models/following';
import { publishMainStream } from '../stream';
import { renderActivity } from '../../remote/activitypub/renderer';
import renderFollow from '../../remote/activitypub/renderer/follow';
import renderUndo from '../../remote/activitypub/renderer/undo';
import { deliver } from '../../queue';
import perUserFollowingChart from '../../services/chart/per-user-following';
import Logger from '../../misc/logger';
import { registerOrFetchInstanceDoc } from '../register-or-fetch-instance-doc';
import Instance from '../../models/instance';
import instanceChart from '../../services/chart/instance';

const logger = new Logger('following/delete');

export default async function(follower: IUser, followee: IUser) {
	const following = await Following.findOne({
		followerId: follower._id,
		followeeId: followee._id
	});

	if (following == null) {
		logger.warn('フォロー解除がリクエストされましたがフォローしていませんでした');
		return;
	}

	Following.remove({
		_id: following._id
	});

	//#region Decrement following count
	User.update({ _id: follower._id }, {
		$inc: {
			followingCount: -1
		}
	});
	//#endregion

	//#region Decrement followers count
	User.update({ _id: followee._id }, {
		$inc: {
			followersCount: -1
		}
	});
	//#endregion

	//#region Update instance stats
	if (isRemoteUser(follower) && isLocalUser(followee)) {
		registerOrFetchInstanceDoc(follower.host).then(i => {
			Instance.update({ _id: i._id }, {
				$inc: {
					followingCount: -1
				}
			});

			instanceChart.updateFollowing(i.host, false);
		});
	} else if (isLocalUser(follower) && isRemoteUser(followee)) {
		registerOrFetchInstanceDoc(followee.host).then(i => {
			Instance.update({ _id: i._id }, {
				$inc: {
					followersCount: -1
				}
			});

			instanceChart.updateFollowers(i.host, false);
		});
	}
	//#endregion

	perUserFollowingChart.update(follower, followee, false);

	// Publish unfollow event
	if (isLocalUser(follower)) {
		packUser(followee, follower, {
			detail: true
		}).then(packed => publishMainStream(follower._id, 'unfollow', packed));
	}

	if (isLocalUser(follower) && isRemoteUser(followee)) {
		const content = renderActivity(renderUndo(renderFollow(follower, followee), follower));
		deliver(follower, content, followee.inbox);
	}
}
