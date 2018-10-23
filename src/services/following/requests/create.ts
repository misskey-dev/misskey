import User, { isLocalUser, isRemoteUser, pack as packUser, IUser } from '../../../models/user';
import { publishMainStream } from '../../../stream';
import notify from '../../../notify';
import pack from '../../../remote/activitypub/renderer';
import renderFollow from '../../../remote/activitypub/renderer/follow';
import { deliver } from '../../../queue';
import FollowRequest from '../../../models/follow-request';

export default async function(follower: IUser, followee: IUser, requestId?: string) {
	await FollowRequest.insert({
		createdAt: new Date(),
		followerId: follower._id,
		followeeId: followee._id,
		requestId,

		// 非正規化
		_follower: {
			host: follower.host,
			inbox: isRemoteUser(follower) ? follower.inbox : undefined,
			sharedInbox: isRemoteUser(follower) ? follower.sharedInbox : undefined
		},
		_followee: {
			host: followee.host,
			inbox: isRemoteUser(followee) ? followee.inbox : undefined,
			sharedInbox: isRemoteUser(followee) ? followee.sharedInbox : undefined
		}
	});

	await User.update({ _id: followee._id }, {
		$inc: {
			pendingReceivedFollowRequestsCount: 1
		}
	});

	// Publish receiveRequest event
	if (isLocalUser(followee)) {
		packUser(follower, followee).then(packed => publishMainStream(followee._id, 'receiveFollowRequest', packed));

		packUser(followee, followee, {
			detail: true
		}).then(packed => publishMainStream(followee._id, 'meUpdated', packed));

		// 通知を作成
		notify(followee._id, follower._id, 'receiveFollowRequest');
	}

	if (isLocalUser(follower) && isRemoteUser(followee)) {
		const content = pack(renderFollow(follower, followee));
		deliver(follower, content, followee.inbox);
	}
}
