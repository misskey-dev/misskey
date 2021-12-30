import unfollow from '@/services/following/delete';
import cancelRequest from '@/services/following/requests/cancel';
import {IAccept} from '../../type';
import { IRemoteUser } from '@/models/entities/user';
import { Followings } from '@/models/index';
import DbResolver from '../../db-resolver';

export default async (actor: IRemoteUser, activity: IAccept): Promise<string> => {
	const dbResolver = new DbResolver();

	const follower = await dbResolver.getUserFromApId(activity.object);
	if (follower == null) {
		return `skip: follower not found`;
	}

	const following = await Followings.findOne({
		followerId: follower.id,
		followeeId: actor.id,
	});

	if (following) {
		await unfollow(follower, actor);
		return `ok: unfollowed`;
	}

	return `skip: フォローされていない`;
};
