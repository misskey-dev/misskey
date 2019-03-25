import { publishMainStream } from '../../stream';
import notify from '../../../services/create-notification';
import { renderActivity } from '../../../remote/activitypub/renderer';
import renderFollow from '../../../remote/activitypub/renderer/follow';
import { deliver } from '../../../queue';
import { User } from '../../../models/entities/user';
import { Blockings, FollowRequests, Users } from '../../../models';

export default async function(follower: User, followee: User, requestId?: string) {
	// check blocking
	const [blocking, blocked] = await Promise.all([
		Blockings.findOne({
			blockerId: follower.id,
			blockeeId: followee.id,
		}),
		Blockings.findOne({
			blockerId: followee.id,
			blockeeId: follower.id,
		})
	]);

	if (blocking != null) throw new Error('blocking');
	if (blocked != null) throw new Error('blocked');

	await FollowRequests.save({
		createdAt: new Date(),
		followerId: follower.id,
		followeeId: followee.id,
		requestId,

		// 非正規化
		followerHost: follower.host,
		followerInbox: Users.isRemoteUser(follower) ? follower.inbox : undefined,
		followerSharedInbox: Users.isRemoteUser(follower) ? follower.sharedInbox : undefined,
		followeeHost: followee.host,
		followeeInbox: Users.isRemoteUser(followee) ? followee.inbox : undefined,
		followeeSharedInbox: Users.isRemoteUser(followee) ? followee.sharedInbox : undefined
	});

	// Publish receiveRequest event
	if (Users.isLocalUser(followee)) {
		Users.pack(follower, followee).then(packed => publishMainStream(followee.id, 'receiveFollowRequest', packed));

		Users.pack(followee, followee, {
			detail: true
		}).then(packed => publishMainStream(followee.id, 'meUpdated', packed));

		// 通知を作成
		notify(followee.id, follower.id, 'receiveFollowRequest');
	}

	if (Users.isLocalUser(follower) && Users.isRemoteUser(followee)) {
		const content = renderActivity(renderFollow(follower, followee));
		deliver(follower, content, followee.inbox);
	}
}
