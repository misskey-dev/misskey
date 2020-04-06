import { IRemoteUser } from '../../../models/entities/user';
import config from '../../../config';
import follow from '../../../services/following/create';
import { IFollow } from '../type';
import { Users } from '../../../models';

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
		throw new Error('フォローしようとしているユーザーはローカルユーザーではありません');
	}

	await follow(actor, followee, activity.id);
};
