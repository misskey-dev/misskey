import { renderActivity } from '@/remote/activitypub/renderer/index';
import renderFollow from '@/remote/activitypub/renderer/follow';
import renderReject from '@/remote/activitypub/renderer/reject';
import { deliver } from '@/queue/index';
import { publishMainStream, publishUserEvent } from '@/services/stream';
import { User, ILocalUser, IRemoteUser } from '@/models/entities/user';
import { Users, FollowRequests, Followings } from '@/models/index';
import { decrementFollowing } from './delete';

type Local = ILocalUser | { id: User['id']; host: User['host']; uri: User['host'] };
type Remote = IRemoteUser;
type Both = Local | Remote;

/**
 * API following/request/reject
 */
export async function rejectFollowRequest(user: Local, follower: Both) {
	if (Users.isRemoteUser(follower)) {
		deliverReject(user, follower);
	}

	await removeFollowRequest(user, follower);

	if (Users.isLocalUser(follower)) {
		publishUnfollow(user, follower);
	}
}

/**
 * API following/reject
 */
export async function rejectFollow(user: Local, follower: Both) {
	if (Users.isRemoteUser(follower)) {
		deliverReject(user, follower);
	}

	await removeFollow(user, follower);

	if (Users.isLocalUser(follower)) {
		publishUnfollow(user, follower);
	}
}

/**
 * AP Reject/Follow
 */
export async function remoteReject(actor: Remote, follower: Local) {
	await removeFollowRequest(actor, follower);
	await removeFollow(actor, follower);
	publishUnfollow(actor, follower);
}

/**
 * Remove follow request record
 */
async function removeFollowRequest(followee: Both, follower: Both) {
	const request = await FollowRequests.findOne({
		followeeId: followee.id,
		followerId: follower.id
	});

	if (!request) return;

	await FollowRequests.delete(request.id);
}

/**
 * Remove follow record
 */
async function removeFollow(followee: Both, follower: Both) {
	const following = await Followings.findOne({
		followeeId: followee.id,
		followerId: follower.id
	});

	if (!following) return;

	await Followings.delete(following.id);
	decrementFollowing(follower, followee);
}

/**
 * Deliver Reject to remote
 */
async function deliverReject(followee: Local, follower: Remote) {
	const request = await FollowRequests.findOne({
		followeeId: followee.id,
		followerId: follower.id
	});

	const content = renderActivity(renderReject(renderFollow(follower, followee, request?.requestId || undefined), followee));
	deliver(followee, content, follower.inbox);
}

/**
 * Publish unfollow to local
 */
async function publishUnfollow(followee: Both, follower: Local) {
	const packedFollowee = await Users.pack(followee.id, follower, {
		detail: true
	});

	publishUserEvent(follower.id, 'unfollow', packedFollowee);
	publishMainStream(follower.id, 'unfollow', packedFollowee);
}
