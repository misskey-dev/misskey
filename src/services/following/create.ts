import User, { isLocalUser, isRemoteUser, pack as packUser, IUser } from '../../models/user';
import Following from '../../models/following';
import Blocking from '../../models/blocking';
import { publishMainStream } from '../stream';
import notify from '../../services/create-notification';
import { renderActivity } from '../../remote/activitypub/renderer';
import renderFollow from '../../remote/activitypub/renderer/follow';
import renderAccept from '../../remote/activitypub/renderer/accept';
import renderReject from '../../remote/activitypub/renderer/reject';
import { deliver } from '../../queue';
import createFollowRequest from './requests/create';
import perUserFollowingChart from '../../services/chart/per-user-following';
import { registerOrFetchInstanceDoc } from '../register-or-fetch-instance-doc';
import Instance from '../../models/instance';
import instanceChart from '../../services/chart/instance';
import Logger from '../../misc/logger';
import FollowRequest from '../../models/follow-request';

const logger = new Logger('following/create');

export async function insertFollowingDoc(followee: IUser, follower: IUser) {
	let alreadyFollowed = false;

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
			logger.info(`Insert duplicated ignore. ${follower._id} => ${followee._id}`);
			alreadyFollowed = true;
		} else {
			throw e;
		}
	});

	await FollowRequest.remove({
		followeeId: followee._id,
		followerId: follower._id
	});

	if (alreadyFollowed) return;

	//#region Increment counts
	User.update({ _id: follower._id }, {
		$inc: {
			followingCount: 1
		}
	});

	User.update({ _id: followee._id }, {
		$inc: {
			followersCount: 1
		}
	});
	//#endregion

	//#region Update instance stats
	if (isRemoteUser(follower) && isLocalUser(followee)) {
		registerOrFetchInstanceDoc(follower.host).then(i => {
			Instance.update({ _id: i._id }, {
				$inc: {
					followingCount: 1
				}
			});

			instanceChart.updateFollowing(i.host, true);
		});
	} else if (isLocalUser(follower) && isRemoteUser(followee)) {
		registerOrFetchInstanceDoc(followee.host).then(i => {
			Instance.update({ _id: i._id }, {
				$inc: {
					followersCount: 1
				}
			});

			instanceChart.updateFollowers(i.host, true);
		});
	}
	//#endregion

	perUserFollowingChart.update(follower, followee, true);

	// Publish follow event
	if (isLocalUser(follower)) {
		packUser(followee, follower, {
			detail: true
		}).then(packed => publishMainStream(follower._id, 'follow', packed));
	}

	// Publish followed event
	if (isLocalUser(followee)) {
		packUser(follower, followee).then(packed => publishMainStream(followee._id, 'followed', packed)),

		// 通知を作成
		notify(followee._id, follower._id, 'follow');
	}
}

export default async function(follower: IUser, followee: IUser, requestId?: string) {
	// check blocking
	const [blocking, blocked] = await Promise.all([
		Blocking.findOne({
			blockerId: follower._id,
			blockeeId: followee._id,
		}),
		Blocking.findOne({
			blockerId: followee._id,
			blockeeId: follower._id,
		})
	]);

	if (isRemoteUser(follower) && isLocalUser(followee) && blocked) {
		// リモートフォローを受けてブロックしていた場合は、エラーにするのではなくRejectを送り返しておしまい。
		const content = renderActivity(renderReject(renderFollow(follower, followee, requestId), followee));
		deliver(followee , content, follower.inbox);
		return;
	} else if (isRemoteUser(follower) && isLocalUser(followee) && blocking) {
		// リモートフォローを受けてブロックされているはずの場合だったら、ブロック解除しておく。
		await Blocking.remove({
			_id: blocking._id
		});
	} else {
		// それ以外は単純に例外
		if (blocking != null) throw new Error('blocking');
		if (blocked != null) throw new Error('blocked');
	}

	// フォロー対象が鍵アカウントである or
	// フォロワーがBotであり、フォロー対象がBotからのフォローに慎重である or
	// フォロワーがローカルユーザーであり、フォロー対象がリモートユーザーである
	// 上記のいずれかに当てはまる場合はすぐフォローせずにフォローリクエストを発行しておく
	if (followee.isLocked || (followee.carefulBot && follower.isBot) || (isLocalUser(follower) && isRemoteUser(followee))) {
		let autoAccept = false;

		// フォローしているユーザーは自動承認オプション
		if (isLocalUser(followee) && followee.autoAcceptFollowed) {
			const followed = await Following.findOne({
				followerId: followee._id,
				followeeId: follower._id
			});

			if (followed) autoAccept = true;
		}

		if (!autoAccept) {
			await createFollowRequest(follower, followee, requestId);
			return;
		}
	}

	await insertFollowingDoc(followee, follower);

	if (isRemoteUser(follower) && isLocalUser(followee)) {
		const content = renderActivity(renderAccept(renderFollow(follower, followee, requestId), followee));
		deliver(followee, content, follower.inbox);
	}
}
