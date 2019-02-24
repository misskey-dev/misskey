import { IUser, isRemoteUser, ILocalUser, pack as packUser } from '../../../models/user';
import FollowRequest from '../../../models/follow-request';
import { renderActivity } from '../../../remote/activitypub/renderer';
import renderFollow from '../../../remote/activitypub/renderer/follow';
import renderAccept from '../../../remote/activitypub/renderer/accept';
import { deliver } from '../../../queue';
import { publishMainStream } from '../../stream';
import { insertFollowingDoc } from '../create';

export default async function(followee: IUser, follower: IUser) {
	const request = await FollowRequest.findOne({
		followeeId: followee._id,
		followerId: follower._id
	});

	await insertFollowingDoc(followee, follower);

	if (isRemoteUser(follower) && request) {
		const content = renderActivity(renderAccept(renderFollow(follower, followee, request.requestId), followee as ILocalUser));
		deliver(followee as ILocalUser, content, follower.inbox);
	}

	packUser(followee, followee, {
		detail: true
	}).then(packed => publishMainStream(followee._id, 'meUpdated', packed));
}
