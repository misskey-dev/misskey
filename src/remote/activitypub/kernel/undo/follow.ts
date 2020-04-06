import config from '../../../../config';
import unfollow from '../../../../services/following/delete';
import cancelRequest from '../../../../services/following/requests/cancel';
import { IFollow } from '../../type';
import { IRemoteUser } from '../../../../models/entities/user';
import { Users, FollowRequests, Followings } from '../../../../models';

export default async (actor: IRemoteUser, activity: IFollow): Promise<void> => {
	const id = typeof activity.object === 'string' ? activity.object : activity.object.id;
	if (id == null) throw new Error('missing id');

	if (!id.startsWith(config.url + '/')) {
		return;
	}

	const followee = await Users.findOne(id.split('/').pop());

	if (followee == null) {
		throw new Error('followee not found');
	}

	if (followee.host != null) {
		throw new Error('フォロー解除しようとしているユーザーはローカルユーザーではありません');
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
	}

	if (following) {
		await unfollow(actor, followee);
	}
};
