import User, { isLocalUser, isRemoteUser, pack as packUser, IUser } from '../../models/user';
import Following from '../../models/following';
import Blocking from '../../models/blocking';
import { publishMainStream } from '../../stream';
import notify from '../../notify';
import { renderActivity } from '../../remote/activitypub/renderer';
import renderFollow from '../../remote/activitypub/renderer/follow';
import renderAccept from '../../remote/activitypub/renderer/accept';
import renderReject from '../../remote/activitypub/renderer/reject';
import { deliver } from '../../queue';
import createFollowRequest from './requests/create';
import perUserFollowingChart from '../../chart/per-user-following';

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
	});

	//#region Increment following count
	User.update({ _id: follower._id }, {
		$inc: {
			followingCount: 1
		}
	});
	//#endregion

	//#region Increment followers count
	User.update({ _id: followee._id }, {
		$inc: {
			followersCount: 1
		}
	});
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

	if (isRemoteUser(follower) && isLocalUser(followee)) {
		const content = renderActivity(renderAccept(renderFollow(follower, followee, requestId), followee));
		deliver(followee, content, follower.inbox);
	}
}
