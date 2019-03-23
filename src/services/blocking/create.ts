import User, { isLocalUser, isRemoteUser, pack as packUser, User } from '../../models/entities/user';
import Following from '../../models/entities/following';
import FollowRequest from '../../models/follow-request';
import { publishMainStream } from '../stream';
import { renderActivity } from '../../remote/activitypub/renderer';
import renderFollow from '../../remote/activitypub/renderer/follow';
import renderUndo from '../../remote/activitypub/renderer/undo';
import renderBlock from '../../remote/activitypub/renderer/block';
import { deliver } from '../../queue';
import renderReject from '../../remote/activitypub/renderer/reject';
import perUserFollowingChart from '../chart/charts/per-user-following';
import Blocking from '../../models/entities/blocking';

export default async function(blocker: User, blockee: User) {

	await Promise.all([
		cancelRequest(blocker, blockee),
		cancelRequest(blockee, blocker),
		unFollow(blocker, blockee),
		unFollow(blockee, blocker)
	]);

	await Blocking.insert({
		createdAt: new Date(),
		blockerId: blocker.id,
		blockeeId: blockee.id,
	});

	if (isLocalUser(blocker) && isRemoteUser(blockee)) {
		const content = renderActivity(renderBlock(blocker, blockee));
		deliver(blocker, content, blockee.inbox);
	}
}

async function cancelRequest(follower: User, followee: User) {
	const request = await FollowRequest.findOne({
		followeeId: followee.id,
		followerId: follower.id
	});

	if (request == null) {
		return;
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

	if (isLocalUser(followee)) {
		packUser(followee, followee, {
			detail: true
		}).then(packed => publishMainStream(followee.id, 'meUpdated', packed));
	}

	if (isLocalUser(follower)) {
		packUser(followee, follower, {
			detail: true
		}).then(packed => publishMainStream(follower.id, 'unfollow', packed));
	}

	// リモートにフォローリクエストをしていたらUndoFollow送信
	if (isLocalUser(follower) && isRemoteUser(followee)) {
		const content = renderActivity(renderUndo(renderFollow(follower, followee), follower));
		deliver(follower, content, followee.inbox);
	}

	// リモートからフォローリクエストを受けていたらReject送信
	if (isRemoteUser(follower) && isLocalUser(followee)) {
		const content = renderActivity(renderReject(renderFollow(follower, followee, request.requestId), followee));
		deliver(followee, content, follower.inbox);
	}
}

async function unFollow(follower: User, followee: User) {
	const following = await Following.findOne({
		followerId: follower.id,
		followeeId: followee.id
	});

	if (following == null) {
		return;
	}

	Following.remove({
		id: following.id
	});

	//#region Decrement following count
	User.update({ _id: follower.id }, {
		$inc: {
			followingCount: -1
		}
	});
	//#endregion

	//#region Decrement followers count
	User.update({ _id: followee.id }, {
		$inc: {
			followersCount: -1
		}
	});
	//#endregion

	perUserFollowingChart.update(follower, followee, false);

	// Publish unfollow event
	if (isLocalUser(follower)) {
		packUser(followee, follower, {
			detail: true
		}).then(packed => publishMainStream(follower.id, 'unfollow', packed));
	}

	// リモートにフォローをしていたらUndoFollow送信
	if (isLocalUser(follower) && isRemoteUser(followee)) {
		const content = renderActivity(renderUndo(renderFollow(follower, followee), follower));
		deliver(follower, content, followee.inbox);
	}
}
