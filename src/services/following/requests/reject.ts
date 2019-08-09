import { renderActivity } from '~/remote/activitypub/renderer';
import renderFollow from '~/remote/activitypub/renderer/follow';
import renderReject from '~/remote/activitypub/renderer/reject';
import { deliver } from '~/queue';
import { publishMainStream } from '~/services/stream';
import { User, ILocalUser } from '~/models/entities/user';
import { Users, FollowRequests } from '~/models';

export default async function(followee: User, follower: User) {
	if (Users.isRemoteUser(follower)) {
		const request = await FollowRequests.findOne({
			followeeId: followee.id,
			followerId: follower.id
		});

		const content = renderActivity(renderReject(renderFollow(follower, followee, request!.requestId!), followee as ILocalUser));
		deliver(followee as ILocalUser, content, follower.inbox);
	}

	await FollowRequests.delete({
		followeeId: followee.id,
		followerId: follower.id
	});

	Users.pack(followee, follower, {
		detail: true
	}).then(packed => publishMainStream(follower.id, 'unfollow', packed));
}
