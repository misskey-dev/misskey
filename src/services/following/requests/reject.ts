import { renderActivity } from '../../../remote/activitypub/renderer';
import renderFollow from '../../../remote/activitypub/renderer/follow';
import renderReject from '../../../remote/activitypub/renderer/reject';
import { deliver } from '../../../queue';
import { publishMainStream, publishUserEvent } from '../../stream';
import { User, ILocalUser } from '../../../models/entities/user';
import { Users, FollowRequests, Followings } from '../../../models';
import { decrementFollowing } from '../delete';

export default async function(followee: { id: User['id']; host: User['host']; uri: User['host'] }, follower: User) {
	if (Users.isRemoteUser(follower) && Users.isLocalUser(followee)) {
		const request = await FollowRequests.findOne({
			followeeId: followee.id,
			followerId: follower.id
		});

		const content = renderActivity(renderReject(renderFollow(follower, followee, request!.requestId!), followee));
		deliver(followee, content, follower.inbox);
	}

	const request = await FollowRequests.findOne({
		followeeId: followee.id,
		followerId: follower.id
	});

	if (request) {
		await FollowRequests.delete(request.id);
	} else {
		const following = await Followings.findOne({
			followeeId: followee.id,
			followerId: follower.id
		});

		if (following) {
			await Followings.delete(following.id);
			decrementFollowing(follower, followee);
		}
	}

	Users.pack(followee.id, follower, {
		detail: true
	}).then(packed => {
		publishUserEvent(follower.id, 'unfollow', packed);
		publishMainStream(follower.id, 'unfollow', packed);
	});
}
