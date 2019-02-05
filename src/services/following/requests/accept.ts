import User, { IUser, isRemoteUser, ILocalUser, pack as packUser, isLocalUser } from '../../../models/user';
import FollowRequest from '../../../models/follow-request';
import { renderActivity } from '../../../remote/activitypub/renderer';
import renderFollow from '../../../remote/activitypub/renderer/follow';
import renderAccept from '../../../remote/activitypub/renderer/accept';
import { deliver } from '../../../queue';
import Following from '../../../models/following';
import { publishMainStream } from '../../stream';
import perUserFollowingChart from '../../../chart/per-user-following';
import Logger from '../../../misc/logger';

const logger = new Logger('following/requests/accept');

export default async function(followee: IUser, follower: IUser) {
	let incremented = 1;

	await Following.insert({
		createdAt: new Date(),
		followerId: follower._id,
		followeeId: followee._id,

		// 非正規化
		_follower: {
			host: follower.host,
			inbox: isRemoteUser(follower) ? follower.inbox : undefined,
			sharedInbox: isRemoteUser(follower) ? follower.sharedInbox : undefined
		},
		_followee: {
			host: followee.host,
			inbox: isRemoteUser(followee) ? followee.inbox : undefined,
			sharedInbox: isRemoteUser(followee) ? followee.sharedInbox : undefined
		}
	}).catch(e => {
		if (e.code === 11000 && isRemoteUser(follower) && isLocalUser(followee)) {
			logger.info(`Accept => Insert duplicated ignore. ${follower._id} => ${followee._id}`);
			incremented = 0;
		} else {
			throw e;
		}
	});

	if (isRemoteUser(follower)) {
		const request = await FollowRequest.findOne({
			followeeId: followee._id,
			followerId: follower._id
		});

		const content = renderActivity(renderAccept(renderFollow(follower, followee, request.requestId), followee as ILocalUser));
		deliver(followee as ILocalUser, content, follower.inbox);
	}

	await FollowRequest.remove({
		followeeId: followee._id,
		followerId: follower._id
	});

	//#region Increment following count
	await User.update({ _id: follower._id }, {
		$inc: {
			followingCount: incremented
		}
	});
	//#endregion

	//#region Increment followers count
	await User.update({ _id: followee._id }, {
		$inc: {
			followersCount: incremented
		}
	});
	//#endregion

	perUserFollowingChart.update(follower, followee, true);

	await User.update({ _id: followee._id }, {
		$inc: {
			pendingReceivedFollowRequestsCount: -1
		}
	});

	packUser(followee, followee, {
		detail: true
	}).then(packed => publishMainStream(followee._id, 'meUpdated', packed));

	packUser(followee, follower, {
		detail: true
	}).then(packed => publishMainStream(follower._id, 'follow', packed));
}
