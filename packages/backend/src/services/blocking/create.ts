import { publishMainStream, publishUserEvent } from '@/services/stream.js';
import { renderActivity } from '@/remote/activitypub/renderer/index.js';
import renderFollow from '@/remote/activitypub/renderer/follow.js';
import renderUndo from '@/remote/activitypub/renderer/undo.js';
import { renderBlock } from '@/remote/activitypub/renderer/block.js';
import { deliver } from '@/queue/index.js';
import renderReject from '@/remote/activitypub/renderer/reject.js';
import { Blocking } from '@/models/entities/blocking.js';
import { User } from '@/models/entities/user.js';
import { Blockings, Users, FollowRequests, Followings, UserListJoinings, UserLists } from '@/models/index.js';
import { perUserFollowingChart } from '@/services/chart/index.js';
import { genId } from '@/misc/gen-id.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import { getActiveWebhooks } from '@/misc/webhook-cache.js';
import { webhookDeliver } from '@/queue/index.js';

export default async function(blocker: User, blockee: User) {
	await Promise.all([
		cancelRequest(blocker, blockee),
		cancelRequest(blockee, blocker),
		unFollow(blocker, blockee),
		unFollow(blockee, blocker),
		removeFromList(blockee, blocker),
	]);

	const blocking = {
		id: genId(),
		createdAt: new Date(),
		blocker,
		blockerId: blocker.id,
		blockee,
		blockeeId: blockee.id,
	} as Blocking;

	await Blockings.insert(blocking);

	if (Users.isLocalUser(blocker) && Users.isRemoteUser(blockee)) {
		const content = renderActivity(renderBlock(blocking));
		deliver(blocker, content, blockee.inbox);
	}
}

async function cancelRequest(follower: User, followee: User) {
	const request = await FollowRequests.findOneBy({
		followeeId: followee.id,
		followerId: follower.id,
	});

	if (request == null) {
		return;
	}

	await FollowRequests.delete({
		followeeId: followee.id,
		followerId: follower.id,
	});

	if (Users.isLocalUser(followee)) {
		Users.pack(followee, followee, {
			detail: true,
		}).then(packed => publishMainStream(followee.id, 'meUpdated', packed));
	}

	if (Users.isLocalUser(follower)) {
		Users.pack(followee, follower, {
			detail: true,
		}).then(async packed => {
			publishUserEvent(follower.id, 'unfollow', packed);
			publishMainStream(follower.id, 'unfollow', packed);

			const webhooks = (await getActiveWebhooks()).filter(x => x.userId === follower.id && x.on.includes('unfollow'));
			for (const webhook of webhooks) {
				webhookDeliver(webhook, 'unfollow', {
					user: packed,
				});
			}
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
	const following = await Followings.findOneBy({
		followerId: follower.id,
		followeeId: followee.id,
	});

	if (following == null) {
		return;
	}

	await Promise.all([
		Followings.delete(following.id),
		Users.decrement({ id: follower.id }, 'followingCount', 1),
		Users.decrement({ id: followee.id }, 'followersCount', 1),
		perUserFollowingChart.update(follower, followee, false),
	]);

	// Publish unfollow event
	if (Users.isLocalUser(follower)) {
		Users.pack(followee, follower, {
			detail: true,
		}).then(async packed => {
			publishUserEvent(follower.id, 'unfollow', packed);
			publishMainStream(follower.id, 'unfollow', packed);

			const webhooks = (await getActiveWebhooks()).filter(x => x.userId === follower.id && x.on.includes('unfollow'));
			for (const webhook of webhooks) {
				webhookDeliver(webhook, 'unfollow', {
					user: packed,
				});
			}
		});
	}

	// リモートにフォローをしていたらUndoFollow送信
	if (Users.isLocalUser(follower) && Users.isRemoteUser(followee)) {
		const content = renderActivity(renderUndo(renderFollow(follower, followee), follower));
		deliver(follower, content, followee.inbox);
	}
}

async function removeFromList(listOwner: User, user: User) {
	const userLists = await UserLists.findBy({
		userId: listOwner.id,
	});

	for (const userList of userLists) {
		await UserListJoinings.delete({
			userListId: userList.id,
			userId: user.id,
		});
	}
}
