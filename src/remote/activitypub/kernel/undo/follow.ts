import unfollow from '../../../../services/following/delete';
import cancelRequest from '../../../../services/following/requests/cancel';
import { IFollow } from '../../type';
import { IRemoteUser } from '../../../../models/entities/user';
import { FollowRequests, Followings } from '../../../../models';
import DbResolver from '../../db-resolver';

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
		followeeId: followee.id
	});

	const following = await Followings.findOne({
		followerId: actor.id,
		followeeId: followee.id
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
