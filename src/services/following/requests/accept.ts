import { renderActivity } from '~/remote/activitypub/renderer';
import renderFollow from '~/remote/activitypub/renderer/follow';
import renderAccept from '~/remote/activitypub/renderer/accept';
import { deliver } from '~/queue';
import { publishMainStream } from '~/services/stream';
import { insertFollowingDoc } from '~/services/following/create';
import { User, ILocalUser } from '~/models/entities/user';
import { FollowRequests, Users } from '~/models';

export default async function(followee: User, follower: User) {
	const request = await FollowRequests.findOne({
		followeeId: followee.id,
		followerId: follower.id
	});

	await insertFollowingDoc(followee, follower);

	if (Users.isRemoteUser(follower) && request) {
		const content = renderActivity(renderAccept(renderFollow(follower, followee, request.requestId!), followee as ILocalUser));
		deliver(followee as ILocalUser, content, follower.inbox);
	}

	Users.pack(followee, followee, {
		detail: true
	}).then(packed => publishMainStream(followee.id, 'meUpdated', packed));
}
