import User, { isLocalUser, isRemoteUser, pack as packUser, IUser } from '../../../models/user';
import event from '../../../publishers/stream';
import notify from '../../../publishers/notify';
import pack from '../../../remote/activitypub/renderer';
import renderFollow from '../../../remote/activitypub/renderer/follow';
import { deliver } from '../../../queue';
import FollowRequest from '../../../models/follow-request';

export default async function(follower: IUser, followee: IUser) {
	if (!followee.isLocked) throw '対象のアカウントは鍵アカウントではありません';

	await FollowRequest.insert({
		createdAt: new Date(),
		followerId: follower._id,
		followeeId: followee._id,

		// 非正規化
		_follower: {
			host: follower.host,
			inbox: isRemoteUser(follower) ? follower.inbox : undefined
		},
		_followee: {
			host: followee.host,
			inbox: isRemoteUser(followee) ? followee.inbox : undefined
		}
	});

	await User.update({ _id: followee._id }, {
		$inc: {
			pendingReceivedFollowRequestsCount: 1
		}
	});

	// Publish receiveRequest event
	if (isLocalUser(followee)) {
		packUser(follower, followee).then(packed => event(followee._id, 'receiveFollowRequest', packed));

		packUser(followee, followee, {
			detail: true
		}).then(packed => event(followee._id, 'meUpdated', packed));

		// 通知を作成
		notify(followee._id, follower._id, 'receiveFollowRequest');
	}

	if (isLocalUser(follower) && isRemoteUser(followee)) {
		const content = pack(renderFollow(follower, followee));
		deliver(follower, content, followee.inbox);
	}
}
