import User, { isLocalUser, isRemoteUser, pack as packUser, IUser } from '../../models/user';
import Following from '../../models/following';
import FollowingLog from '../../models/following-log';
import FollowedLog from '../../models/followed-log';
import event from '../../publishers/stream';
import notify from '../../publishers/notify';
import pack from '../../remote/activitypub/renderer';
import renderFollow from '../../remote/activitypub/renderer/follow';
import renderAccept from '../../remote/activitypub/renderer/accept';
import { deliver } from '../../queue';
import FollowRequest from '../../models/follow-request';

export default async function(follower: IUser, followee: IUser) {
	if (followee.isLocked) {
		await FollowRequest.insert({
			createdAt: new Date(),
			followerId: follower._id,
			followeeId: followee._id,

			// 非正規化
			_follower: {
				host: follower.host,
				inbox: isRemoteUser(follower) ? follower.inbox : undefined
			},
			_followee: {
				host: followee.host,
				inbox: isRemoteUser(followee) ? followee.inbox : undefined
			}
		});

		// Publish reciveRequest event
		if (isLocalUser(followee)) {
			packUser(follower, followee).then(packed => event(followee._id, 'reciveRequest', packed)),

			// 通知を作成
			notify(followee._id, follower._id, 'reciveRequest');
		}

		if (isLocalUser(follower) && isRemoteUser(followee)) {
			const content = pack(renderFollow(follower, followee));
			deliver(follower, content, followee.inbox);
		}
	} else {
		const following = await Following.insert({
			createdAt: new Date(),
			followerId: follower._id,
			followeeId: followee._id,

			// 非正規化
			_follower: {
				host: follower.host,
				inbox: isRemoteUser(follower) ? follower.inbox : undefined
			},
			_followee: {
				host: followee.host,
				inbox: isRemoteUser(followee) ? followee.inbox : undefined
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
			packUser(followee, follower).then(packed => event(follower._id, 'follow', packed));
		}

		// Publish followed event
		if (isLocalUser(followee)) {
			packUser(follower, followee).then(packed => event(followee._id, 'followed', packed)),

			// 通知を作成
			notify(followee._id, follower._id, 'follow');
		}

		if (isLocalUser(follower) && isRemoteUser(followee)) {
			const content = pack(renderFollow(follower, followee));
			deliver(follower, content, followee.inbox);
		}

		if (isRemoteUser(follower) && isLocalUser(followee)) {
			const content = pack(renderAccept(renderFollow(follower, followee)));
			deliver(followee, content, follower.inbox);
		}
	}
}
