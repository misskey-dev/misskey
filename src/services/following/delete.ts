import User, { isLocalUser, isRemoteUser, pack as packUser, IUser } from '../../models/user';
import Following from '../../models/following';
import FollowingLog from '../../models/following-log';
import FollowedLog from '../../models/followed-log';
import event from '../../publishers/stream';
import pack from '../../remote/activitypub/renderer';
import renderFollow from '../../remote/activitypub/renderer/follow';
import renderUndo from '../../remote/activitypub/renderer/undo';
import { deliver } from '../../queue';

export default async function(follower: IUser, followee: IUser, activity?) {
	const following = await Following.findOne({
		followerId: follower._id,
		followeeId: followee._id
	});

	if (following == null) {
		console.warn('フォロー解除がリクエストされましたがフォローしていませんでした');
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

	FollowingLog.insert({
		createdAt: following.createdAt,
		userId: follower._id,
		count: follower.followingCount - 1
	});
	//#endregion

	//#region Decrement followers count
	User.update({ _id: followee._id }, {
		$inc: {
			followersCount: -1
		}
	});
	FollowedLog.insert({
		createdAt: following.createdAt,
		userId: followee._id,
		count: followee.followersCount - 1
	});
	//#endregion

	// Publish unfollow event
	if (isLocalUser(follower)) {
		packUser(followee, follower).then(packed => event(follower._id, 'unfollow', packed));
	}

	if (isLocalUser(follower) && isRemoteUser(followee)) {
		const content = pack(renderUndo(renderFollow(follower, followee)));
		deliver(follower, content, followee.inbox).save();
	}
}
