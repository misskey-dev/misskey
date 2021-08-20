import { publishMainStream, publishUserEvent } from '@/services/stream';
import { renderActivity } from '@/remote/activitypub/renderer/index';
import renderFollow from '@/remote/activitypub/renderer/follow';
import renderUndo from '@/remote/activitypub/renderer/undo';
import { deliver } from '@/queue/index';
import Logger from '../logger';
import { registerOrFetchInstanceDoc } from '../register-or-fetch-instance-doc';
import { User } from '@/models/entities/user';
import { Followings, Users, Instances } from '@/models/index';
import { instanceChart, perUserFollowingChart } from '@/services/chart/index';

const logger = new Logger('following/delete');

export default async function(follower: { id: User['id']; host: User['host']; uri: User['host']; inbox: User['inbox']; sharedInbox: User['sharedInbox']; }, followee: { id: User['id']; host: User['host']; uri: User['host']; inbox: User['inbox']; sharedInbox: User['sharedInbox']; }, silent = false) {
	const following = await Followings.findOne({
		followerId: follower.id,
		followeeId: followee.id
	});

	if (following == null) {
		logger.warn('フォロー解除がリクエストされましたがフォローしていませんでした');
		return;
	}

	await Followings.delete(following.id);

	decrementFollowing(follower, followee);

	// Publish unfollow event
	if (!silent && Users.isLocalUser(follower)) {
		Users.pack(followee.id, follower, {
			detail: true
		}).then(packed => {
			publishUserEvent(follower.id, 'unfollow', packed);
			publishMainStream(follower.id, 'unfollow', packed);
		});
	}

	if (Users.isLocalUser(follower) && Users.isRemoteUser(followee)) {
		const content = renderActivity(renderUndo(renderFollow(follower, followee), follower));
		deliver(follower, content, followee.inbox);
	}
}

export async function decrementFollowing(follower: { id: User['id']; host: User['host']; }, followee: { id: User['id']; host: User['host']; }) {
	//#region Decrement following count
	Users.decrement({ id: follower.id }, 'followingCount', 1);
	//#endregion

	//#region Decrement followers count
	Users.decrement({ id: followee.id }, 'followersCount', 1);
	//#endregion

	//#region Update instance stats
	if (Users.isRemoteUser(follower) && Users.isLocalUser(followee)) {
		registerOrFetchInstanceDoc(follower.host).then(i => {
			Instances.decrement({ id: i.id }, 'followingCount', 1);
			instanceChart.updateFollowing(i.host, false);
		});
	} else if (Users.isLocalUser(follower) && Users.isRemoteUser(followee)) {
		registerOrFetchInstanceDoc(followee.host).then(i => {
			Instances.decrement({ id: i.id }, 'followersCount', 1);
			instanceChart.updateFollowers(i.host, false);
		});
	}
	//#endregion

	perUserFollowingChart.update(follower, followee, false);
}
