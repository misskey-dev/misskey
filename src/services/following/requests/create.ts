import User, { isLocalUser, isRemoteUser, pack as packUser, User } from '../../../models/entities/user';
import { publishMainStream } from '../../stream';
import notify from '../../../services/create-notification';
import { renderActivity } from '../../../remote/activitypub/renderer';
import renderFollow from '../../../remote/activitypub/renderer/follow';
import { deliver } from '../../../queue';
import FollowRequest from '../../../models/follow-request';
import Blocking from '../../../models/entities/blocking';

export default async function(follower: User, followee: User, requestId?: string) {
	// check blocking
	const [blocking, blocked] = await Promise.all([
		Blocking.findOne({
			blockerId: follower.id,
			blockeeId: followee.id,
		}),
		Blocking.findOne({
			blockerId: followee.id,
			blockeeId: follower.id,
		})
	]);

	if (blocking != null) throw new Error('blocking');
	if (blocked != null) throw new Error('blocked');

	await FollowRequest.insert({
		createdAt: new Date(),
		followerId: follower.id,
		followeeId: followee.id,
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

	await User.update({ _id: followee.id }, {
		$inc: {
			pendingReceivedFollowRequestsCount: 1
		}
	});

	// Publish receiveRequest event
	if (isLocalUser(followee)) {
		packUser(follower, followee).then(packed => publishMainStream(followee.id, 'receiveFollowRequest', packed));

		packUser(followee, followee, {
			detail: true
		}).then(packed => publishMainStream(followee.id, 'meUpdated', packed));

		// 通知を作成
		notify(followee.id, follower.id, 'receiveFollowRequest');
	}

	if (isLocalUser(follower) && isRemoteUser(followee)) {
		const content = renderActivity(renderFollow(follower, followee));
		deliver(follower, content, followee.inbox);
	}
}
