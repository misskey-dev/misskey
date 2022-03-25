import { publishMainStream } from '@/services/stream.js';
import { renderActivity } from '@/remote/activitypub/renderer/index.js';
import renderFollow from '@/remote/activitypub/renderer/follow.js';
import { deliver } from '@/queue/index.js';
import { User } from '@/models/entities/user.js';
import { Blockings, FollowRequests, Users } from '@/models/index.js';
import { genId } from '@/misc/gen-id.js';
import { createNotification } from '../../create-notification.js';

export default async function(follower: { id: User['id']; host: User['host']; uri: User['host']; inbox: User['inbox']; sharedInbox: User['sharedInbox']; }, followee: { id: User['id']; host: User['host']; uri: User['host']; inbox: User['inbox']; sharedInbox: User['sharedInbox']; }, requestId?: string) {
	if (follower.id === followee.id) return;

	// check blocking
	const [blocking, blocked] = await Promise.all([
		Blockings.findOneBy({
			blockerId: follower.id,
			blockeeId: followee.id,
		}),
		Blockings.findOneBy({
			blockerId: followee.id,
			blockeeId: follower.id,
		}),
	]);

	if (blocking != null) throw new Error('blocking');
	if (blocked != null) throw new Error('blocked');

	const followRequest = await FollowRequests.insert({
		id: genId(),
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
		followeeSharedInbox: Users.isRemoteUser(followee) ? followee.sharedInbox : undefined,
	}).then(x => FollowRequests.findOneByOrFail(x.identifiers[0]));

	// Publish receiveRequest event
	if (Users.isLocalUser(followee)) {
		Users.pack(follower.id, followee).then(packed => publishMainStream(followee.id, 'receiveFollowRequest', packed));

		Users.pack(followee.id, followee, {
			detail: true,
		}).then(packed => publishMainStream(followee.id, 'meUpdated', packed));

		// 通知を作成
		createNotification(followee.id, 'receiveFollowRequest', {
			notifierId: follower.id,
			followRequestId: followRequest.id,
		});
	}

	if (Users.isLocalUser(follower) && Users.isRemoteUser(followee)) {
		const content = renderActivity(renderFollow(follower, followee));
		deliver(follower, content, followee.inbox);
	}
}
