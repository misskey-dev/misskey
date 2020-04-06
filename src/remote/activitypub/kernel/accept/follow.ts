import { IRemoteUser } from '../../../../models/entities/user';
import config from '../../../../config';
import accept from '../../../../services/following/requests/accept';
import { IFollow } from '../../type';
import { Users } from '../../../../models';

export default async (actor: IRemoteUser, activity: IFollow): Promise<void> => {
	const id = typeof activity.actor === 'string' ? activity.actor : activity.actor.id;
	if (id == null) throw new Error('missing id');

	if (!id.startsWith(config.url + '/')) {
		return;
	}

	const follower = await Users.findOne({
		id: id.split('/').pop()
	});

	if (follower == null) {
		throw new Error('follower not found');
	}

	if (follower.host != null) {
		throw new Error('フォローリクエストしたユーザーはローカルユーザーではありません');
	}

	await accept(actor, follower);
};
