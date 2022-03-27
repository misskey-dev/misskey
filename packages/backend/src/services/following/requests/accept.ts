import { renderActivity } from '@/remote/activitypub/renderer/index.js';
import renderFollow from '@/remote/activitypub/renderer/follow.js';
import renderAccept from '@/remote/activitypub/renderer/accept.js';
import { deliver } from '@/queue/index.js';
import { publishMainStream } from '@/services/stream.js';
import { insertFollowingDoc } from '../create.js';
import { User, ILocalUser, CacheableUser } from '@/models/entities/user.js';
import { FollowRequests, Users } from '@/models/index.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';

export default async function(followee: { id: User['id']; host: User['host']; uri: User['host']; inbox: User['inbox']; sharedInbox: User['sharedInbox']; }, follower: CacheableUser) {
	const request = await FollowRequests.findOneBy({
		followeeId: followee.id,
		followerId: follower.id,
	});

	if (request == null) {
		throw new IdentifiableError('8884c2dd-5795-4ac9-b27e-6a01d38190f9', 'No follow request.');
	}

	await insertFollowingDoc(followee, follower);

	if (Users.isRemoteUser(follower) && Users.isLocalUser(followee)) {
		const content = renderActivity(renderAccept(renderFollow(follower, followee, request.requestId!), followee));
		deliver(followee, content, follower.inbox);
	}

	Users.pack(followee.id, followee, {
		detail: true,
	}).then(packed => publishMainStream(followee.id, 'meUpdated', packed));
}
