import parseAcct from '../../../../acct/parse';
import User, { IRemoteUser } from '../../../../models/user';
import config from '../../../../config';
import unfollow from '../../../../services/following/delete';
import { IFollow } from '../../type';

export default async (actor: IRemoteUser, activity: IFollow): Promise<void> => {
	const prefix = config.url + '/@';
	const id = typeof activity == 'string' ? activity : activity.id;

	if (!id.startsWith(prefix)) {
		return null;
	}

	const { username, host } = parseAcct(id.slice(prefix.length));
	if (host !== null) {
		throw new Error();
	}

	const followee = await User.findOne({ username, host });
	if (followee === null) {
		throw new Error();
	}

	await unfollow(actor, followee, activity);
};
