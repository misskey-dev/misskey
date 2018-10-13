import User, { isLocalUser, isRemoteUser, pack as packUser, IUser } from '../../models/user';
import Following from '../../models/following';
import FollowingLog from '../../models/following-log';
import FollowedLog from '../../models/followed-log';
import { publishMainStream } from '../../stream';
import notify from '../../notify';
import pack from '../../remote/activitypub/renderer';
import renderFollow from '../../remote/activitypub/renderer/follow';
import renderAccept from '../../remote/activitypub/renderer/accept';
import { deliver } from '../../queue';
import createFollowRequest from './requests/create';

export default async function(follower: IUser, followee: IUser) {
	// フォロー対象が鍵アカウントである or
	// フォロワーがBotであり、フォロー対象がBotからのフォローに慎重である or
	// フォロワーがローカルユーザーであり、フォロー対象がリモートユーザーである
	// 上記のいずれかに当てはまる場合はすぐフォローせずにフォローリクエストを発行しておく
	if (followee.isLocked || (followee.carefulBot && follower.isBot) || (isLocalUser(follower) && isRemoteUser(followee))) {
		await createFollowRequest(follower, followee);
		return;
	}

	const following = await Following.insert({
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

	FollowingLog.insert({
		createdAt: following.createdAt,
		userId: follower._id,
		count: follower.followingCount + 1
	});
	//#endregion

	//#region Increment followers count
	User.update({ _id: followee._id }, {
		$inc: {
			followersCount: 1
		}
	});
	FollowedLog.insert({
		createdAt: following.createdAt,
		userId: followee._id,
		count: followee.followersCount + 1
	});
	//#endregion

	// Publish follow event
	if (isLocalUser(follower)) {
		packUser(followee, follower).then(packed => publishMainStream(follower._id, 'follow', packed));
	}

	// Publish followed event
	if (isLocalUser(followee)) {
		packUser(follower, followee).then(packed => publishMainStream(followee._id, 'followed', packed)),

		// 通知を作成
		notify(followee._id, follower._id, 'follow');
	}

	if (isRemoteUser(follower) && isLocalUser(followee)) {
		const content = pack(renderAccept(renderFollow(follower, followee)));
		deliver(followee, content, follower.inbox);
	}
}
