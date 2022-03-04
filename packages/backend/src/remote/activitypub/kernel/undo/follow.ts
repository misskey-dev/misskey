import unfollow from '@/services/following/delete.js';
import cancelRequest from '@/services/following/requests/cancel.js';
import { IFollow } from '../../type.js';
import { IRemoteUser } from '@/models/entities/user.js';
import { FollowRequests, Followings } from '@/models/index.js';
import DbResolver from '../../db-resolver.js';

export default async (actor: IRemoteUser, activity: IFollow): Promise<string> => {
	const dbResolver = new DbResolver();

	const followee = await dbResolver.getUserFromApId(activity.object);
	if (followee == null) {
		return `skip: followee not found`;
	}

	if (followee.host != null) {
		return `skip: フォロー解除しようとしているユーザーはローカルユーザーではありません`;
	}

	const req = await FollowRequests.findOne({
		followerId: actor.id,
		followeeId: followee.id,
	});

	const following = await Followings.findOne({
		followerId: actor.id,
		followeeId: followee.id,
	});

	if (req) {
		await cancelRequest(followee, actor);
		return `ok: follow request canceled`;
	}

	if (following) {
		await unfollow(actor, followee);
		return `ok: unfollowed`;
	}

	return `skip: リクエストもフォローもされていない`;
};
