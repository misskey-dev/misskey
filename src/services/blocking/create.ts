import { publishMainStream, publishUserEvent } from '@/services/stream';
import { renderActivity } from '@/remote/activitypub/renderer/index';
import renderFollow from '@/remote/activitypub/renderer/follow';
import renderUndo from '@/remote/activitypub/renderer/undo';
import renderBlock from '@/remote/activitypub/renderer/block';
import { deliver } from '@/queue/index';
import renderReject from '@/remote/activitypub/renderer/reject';
import { User } from '@/models/entities/user';
import { Blockings, Users, FollowRequests, Followings, UserListJoinings, UserLists } from '@/models/index';
import { perUserFollowingChart } from '@/services/chart/index';
import { genId } from '@/misc/gen-id';
import { IdentifiableError } from '@/misc/identifiable-error';

export default async function(blocker: User, blockee: User) {
	await Promise.all([
		cancelRequest(blocker, blockee),
		cancelRequest(blockee, blocker),
		unFollow(blocker, blockee),
		unFollow(blockee, blocker),
		removeFromList(blockee, blocker),
	]);

	await Blockings.insert({
		id: genId(),
		createdAt: new Date(),
		blockerId: blocker.id,
		blockeeId: blockee.id,
	});

	if (Users.isLocalUser(blocker) && Users.isRemoteUser(blockee)) {
		const content = renderActivity(renderBlock(blocker, blockee));
		deliver(blocker, content, blockee.inbox);
	}
}

async function cancelRequest(follower: User, followee: User) {
	const request = await FollowRequests.findOne({
		followeeId: followee.id,
		followerId: follower.id
	});

	if (request == null) {
		return;
	}

	await FollowRequests.delete({
		followeeId: followee.id,
		followerId: follower.id
	});

	if (Users.isLocalUser(followee)) {
		Users.pack(followee, followee, {
			detail: true
		}).then(packed => publishMainStream(followee.id, 'meUpdated', packed));
	}

	if (Users.isLocalUser(follower)) {
		Users.pack(followee, follower, {
			detail: true
		}).then(packed => {
			publishUserEvent(follower.id, 'unfollow', packed);
			publishMainStream(follower.id, 'unfollow', packed);
		});
	}

	// リモートにフォローリクエストをしていたらUndoFollow送信
	if (Users.isLocalUser(follower) && Users.isRemoteUser(followee)) {
		const content = renderActivity(renderUndo(renderFollow(follower, followee), follower));
		deliver(follower, content, followee.inbox);
	}

	// リモートからフォローリクエストを受けていたらReject送信
	if (Users.isRemoteUser(follower) && Users.isLocalUser(followee)) {
		const content = renderActivity(renderReject(renderFollow(follower, followee, request.requestId!), followee));
		deliver(followee, content, follower.inbox);
	}
}

async function unFollow(follower: User, followee: User) {
	const following = await Followings.findOne({
		followerId: follower.id,
		followeeId: followee.id
	});

	if (following == null) {
		return;
	}

	Followings.delete(following.id);

	//#region Decrement following count
	Users.decrement({ id: follower.id }, 'followingCount', 1);
	//#endregion

	//#region Decrement followers count
	Users.decrement({ id: followee.id }, 'followersCount', 1);
	//#endregion

	perUserFollowingChart.update(follower, followee, false);

	// Publish unfollow event
	if (Users.isLocalUser(follower)) {
		Users.pack(followee, follower, {
			detail: true
		}).then(packed => {
			publishUserEvent(follower.id, 'unfollow', packed);
			publishMainStream(follower.id, 'unfollow', packed);
		});
	}

	// リモートにフォローをしていたらUndoFollow送信
	if (Users.isLocalUser(follower) && Users.isRemoteUser(followee)) {
		const content = renderActivity(renderUndo(renderFollow(follower, followee), follower));
		deliver(follower, content, followee.inbox);
	}
}

async function removeFromList(listOwner: User, user: User) {
	const userLists = await UserLists.find({
		userId: listOwner.id,
	});

	for (const userList of userLists) {
		await UserListJoinings.delete({
			userListId: userList.id,
			userId: user.id,
		});
	}
}
