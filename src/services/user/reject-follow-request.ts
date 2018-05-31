import User, { IUser, isRemoteUser, ILocalUser } from "../../models/user";
import FollowRequest from "../../models/follow-request";
import pack from '../../remote/activitypub/renderer';
import renderFollow from '../../remote/activitypub/renderer/follow';
import renderReject from '../../remote/activitypub/renderer/reject';
import { deliver } from '../../queue';

export default async function(followee: IUser, follower: IUser) {
	if (isRemoteUser(follower)) {
		const content = pack(renderReject(renderFollow(follower, followee)));
		deliver(followee as ILocalUser, content, follower.inbox);
	}

	FollowRequest.remove({
		followeeId: followee._id,
		followerId: follower._id
	});
}
