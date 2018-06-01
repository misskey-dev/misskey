import User, { IUser, isRemoteUser, ILocalUser } from "../../../models/user";
import FollowRequest from "../../../models/follow-request";
import pack from '../../../remote/activitypub/renderer';
import renderFollow from '../../../remote/activitypub/renderer/follow';
import renderUndo from '../../../remote/activitypub/renderer/undo';
import { deliver } from '../../../queue';

export default async function(followee: IUser, follower: IUser) {
	if (isRemoteUser(followee)) {
		const content = pack(renderUndo(renderFollow(follower, followee)));
		deliver(follower as ILocalUser, content, followee.inbox);
	}

	await FollowRequest.remove({
		followeeId: followee._id,
		followerId: follower._id
	});

	User.update({ _id: followee._id }, {
		$inc: {
			pendingReceivedFollowRequestsCount: -1
		}
	});
}
