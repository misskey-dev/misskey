import User, { IUser, isRemoteUser, ILocalUser, pack as packUser } from '../../../models/user';
import FollowRequest from '../../../models/follow-request';
import { renderActivity } from '../../../remote/activitypub/renderer';
import renderFollow from '../../../remote/activitypub/renderer/follow';
import renderUndo from '../../../remote/activitypub/renderer/undo';
import { deliver } from '../../../queue';
import { publishMainStream } from '../../stream';
import { IdentifiableError } from '../../../misc/identifiable-error';

export default async function(followee: IUser, follower: IUser) {
	if (isRemoteUser(followee)) {
		const content = renderActivity(renderUndo(renderFollow(follower, followee), follower));
		deliver(follower as ILocalUser, content, followee.inbox);
	}

	const request = await FollowRequest.findOne({
		followeeId: followee._id,
		followerId: follower._id
	});

	if (request == null) {
		throw new IdentifiableError('17447091-ce07-46dd-b331-c1fd4f15b1e7', 'request not found');
	}

	await FollowRequest.remove({
		followeeId: followee._id,
		followerId: follower._id
	});

	await User.update({ _id: followee._id }, {
		$inc: {
			pendingReceivedFollowRequestsCount: -1
		}
	});

	packUser(followee, followee, {
		detail: true
	}).then(packed => publishMainStream(followee._id, 'meUpdated', packed));
}
