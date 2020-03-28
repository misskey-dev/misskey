import { publishMainStream } from '../stream';
import { renderActivity } from '../../remote/activitypub/renderer';
import renderFollow from '../../remote/activitypub/renderer/follow';
import renderAccept from '../../remote/activitypub/renderer/accept';
import renderReject from '../../remote/activitypub/renderer/reject';
import { deliver } from '../../queue';
import createFollowRequest from './requests/create';
import { registerOrFetchInstanceDoc } from '../register-or-fetch-instance-doc';
import Logger from '../logger';
import { IdentifiableError } from '../../misc/identifiable-error';
import { User } from '../../models/entities/user';
import { Followings, Users, FollowRequests, Blockings, Instances, UserProfiles } from '../../models';
import { instanceChart, perUserFollowingChart } from '../chart';
import { genId } from '../../misc/gen-id';
import { createNotification } from '../create-notification';
import { isDuplicateKeyValueError } from '../../misc/is-duplicate-key-value-error';
import { ensure } from '../../prelude/ensure';

const logger = new Logger('following/create');

export async function insertFollowingDoc(followee: User, follower: User) {
	if (follower.id === followee.id) return;

	let alreadyFollowed = false;

	await Followings.save({
		id: genId(),
		createdAt: new Date(),
		followerId: follower.id,
		followeeId: followee.id,

		// 非正規化
		followerHost: follower.host,
		followerInbox: Users.isRemoteUser(follower) ? follower.inbox : null,
		followerSharedInbox: Users.isRemoteUser(follower) ? follower.sharedInbox : null,
		followeeHost: followee.host,
		followeeInbox: Users.isRemoteUser(followee) ? followee.inbox : null,
		followeeSharedInbox: Users.isRemoteUser(followee) ? followee.sharedInbox : null
	}).catch(e => {
		if (isDuplicateKeyValueError(e) && Users.isRemoteUser(follower) && Users.isLocalUser(followee)) {
			logger.info(`Insert duplicated ignore. ${follower.id} => ${followee.id}`);
			alreadyFollowed = true;
		} else {
			throw e;
		}
	});

	const req = await FollowRequests.findOne({
		followeeId: followee.id,
		followerId: follower.id
	});

	if (req) {
		await FollowRequests.delete({
			followeeId: followee.id,
			followerId: follower.id
		});

		// 通知を作成
		createNotification(follower.id, 'followRequestAccepted', {
			notifierId: followee.id,
		});
	}

	if (alreadyFollowed) return;

	//#region Increment counts
	Users.increment({ id: follower.id }, 'followingCount', 1);
	Users.increment({ id: followee.id }, 'followersCount', 1);
	//#endregion

	//#region Update instance stats
	if (Users.isRemoteUser(follower) && Users.isLocalUser(followee)) {
		registerOrFetchInstanceDoc(follower.host).then(i => {
			Instances.increment({ id: i.id }, 'followingCount', 1);
			instanceChart.updateFollowing(i.host, true);
		});
	} else if (Users.isLocalUser(follower) && Users.isRemoteUser(followee)) {
		registerOrFetchInstanceDoc(followee.host).then(i => {
			Instances.increment({ id: i.id }, 'followersCount', 1);
			instanceChart.updateFollowers(i.host, true);
		});
	}
	//#endregion

	perUserFollowingChart.update(follower, followee, true);

	// Publish follow event
	if (Users.isLocalUser(follower)) {
		Users.pack(followee, follower, {
			detail: true
		}).then(packed => publishMainStream(follower.id, 'follow', packed));
	}

	// Publish followed event
	if (Users.isLocalUser(followee)) {
		Users.pack(follower, followee).then(packed => publishMainStream(followee.id, 'followed', packed)),

		// 通知を作成
		createNotification(followee.id, 'follow', {
			notifierId: follower.id
		});
	}
}

export default async function(follower: User, followee: User, requestId?: string) {
	// check blocking
	const [blocking, blocked] = await Promise.all([
		Blockings.findOne({
			blockerId: follower.id,
			blockeeId: followee.id,
		}),
		Blockings.findOne({
			blockerId: followee.id,
			blockeeId: follower.id,
		})
	]);

	if (Users.isRemoteUser(follower) && Users.isLocalUser(followee) && blocked) {
		// リモートフォローを受けてブロックしていた場合は、エラーにするのではなくRejectを送り返しておしまい。
		const content = renderActivity(renderReject(renderFollow(follower, followee, requestId), followee));
		deliver(followee , content, follower.inbox);
		return;
	} else if (Users.isRemoteUser(follower) && Users.isLocalUser(followee) && blocking) {
		// リモートフォローを受けてブロックされているはずの場合だったら、ブロック解除しておく。
		await Blockings.delete(blocking.id);
	} else {
		// それ以外は単純に例外
		if (blocking != null) throw new IdentifiableError('710e8fb0-b8c3-4922-be49-d5d93d8e6a6e', 'blocking');
		if (blocked != null) throw new IdentifiableError('3338392a-f764-498d-8855-db939dcf8c48', 'blocked');
	}

	const followeeProfile = await UserProfiles.findOne(followee.id).then(ensure);

	// フォロー対象が鍵アカウントである or
	// フォロワーがBotであり、フォロー対象がBotからのフォローに慎重である or
	// フォロワーがローカルユーザーであり、フォロー対象がリモートユーザーである
	// 上記のいずれかに当てはまる場合はすぐフォローせずにフォローリクエストを発行しておく
	if (followee.isLocked || (followeeProfile.carefulBot && follower.isBot) || (Users.isLocalUser(follower) && Users.isRemoteUser(followee))) {
		let autoAccept = false;

		// 鍵アカウントであっても、既にフォローされていた場合はスルー
		const following = await Followings.findOne({
			followerId: follower.id,
			followeeId: followee.id,
		});
		if (following) {
			autoAccept = true;
		}

		// フォローしているユーザーは自動承認オプション
		if (!autoAccept && (Users.isLocalUser(followee) && followeeProfile.autoAcceptFollowed)) {
			const followed = await Followings.findOne({
				followerId: followee.id,
				followeeId: follower.id
			});

			if (followed) autoAccept = true;
		}

		if (!autoAccept) {
			await createFollowRequest(follower, followee, requestId);
			return;
		}
	}

	await insertFollowingDoc(followee, follower);

	if (Users.isRemoteUser(follower) && Users.isLocalUser(followee)) {
		const content = renderActivity(renderAccept(renderFollow(follower, followee, requestId), followee));
		deliver(followee, content, follower.inbox);
	}
}
