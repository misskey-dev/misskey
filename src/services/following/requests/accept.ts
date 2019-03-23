import { User, isRemoteUser, ILocalUser, pack as packUser } from '../../../models/entities/user';
import FollowRequest from '../../../models/entities/follow-request';
import { renderActivity } from '../../../remote/activitypub/renderer';
import renderFollow from '../../../remote/activitypub/renderer/follow';
import renderAccept from '../../../remote/activitypub/renderer/accept';
import { deliver } from '../../../queue';
import { publishMainStream } from '../../stream';
import { insertFollowingDoc } from '../create';

export default async function(followee: User, follower: User) {
	const request = await FollowRequest.findOne({
		followeeId: followee.id,
		followerId: follower.id
	});

	await insertFollowingDoc(followee, follower);

	if (isRemoteUser(follower) && request) {
		const content = renderActivity(renderAccept(renderFollow(follower, followee, request.requestId), followee as ILocalUser));
		deliver(followee as ILocalUser, content, follower.inbox);
	}

	packUser(followee, followee, {
		detail: true
	}).then(packed => publishMainStream(followee.id, 'meUpdated', packed));
}
