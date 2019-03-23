import User, { User, isRemoteUser, ILocalUser, pack as packUser } from '../../../models/entities/user';
import FollowRequest from '../../../models/follow-request';
import { renderActivity } from '../../../remote/activitypub/renderer';
import renderFollow from '../../../remote/activitypub/renderer/follow';
import renderUndo from '../../../remote/activitypub/renderer/undo';
import { deliver } from '../../../queue';
import { publishMainStream } from '../../stream';
import { IdentifiableError } from '../../../misc/identifiable-error';

export default async function(followee: User, follower: User) {
	if (isRemoteUser(followee)) {
		const content = renderActivity(renderUndo(renderFollow(follower, followee), follower));
		deliver(follower as ILocalUser, content, followee.inbox);
	}

	const request = await FollowRequest.findOne({
		followeeId: followee.id,
		followerId: follower.id
	});

	if (request == null) {
		throw new IdentifiableError('17447091-ce07-46dd-b331-c1fd4f15b1e7', 'request not found');
	}

	await FollowRequest.remove({
		followeeId: followee.id,
		followerId: follower.id
	});

	await User.update({ _id: followee.id }, {
		$inc: {
			pendingReceivedFollowRequestsCount: -1
		}
	});

	packUser(followee, followee, {
		detail: true
	}).then(packed => publishMainStream(followee.id, 'meUpdated', packed));
}
