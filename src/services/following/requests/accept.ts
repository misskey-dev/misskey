import { renderActivity } from '../../../remote/activitypub/renderer';
import renderFollow from '../../../remote/activitypub/renderer/follow';
import renderAccept from '../../../remote/activitypub/renderer/accept';
import { deliver } from '../../../queue';
import { publishMainStream } from '../../stream';
import { insertFollowingDoc } from '../create';
import { User, ILocalUser } from '../../../models/entities/user';
import { FollowRequests, Users } from '../../../models';
import { IdentifiableError } from '@/misc/identifiable-error';

export default async function(followee: { id: User['id']; host: User['host']; uri: User['host']; inbox: User['inbox']; sharedInbox: User['sharedInbox']; }, follower: User) {
	const request = await FollowRequests.findOne({
		followeeId: followee.id,
		followerId: follower.id
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
		detail: true
	}).then(packed => publishMainStream(followee.id, 'meUpdated', packed));
}
