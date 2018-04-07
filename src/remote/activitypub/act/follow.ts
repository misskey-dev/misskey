import parseAcct from '../../../acct/parse';
import User, { IRemoteUser } from '../../../models/user';
import config from '../../../config';
import follow from '../../../services/following/create';
import { IFollow } from '../type';

export default async (actor: IRemoteUser, activity: IFollow): Promise<void> => {
	const prefix = config.url + '/@';
	const id = typeof activity.object == 'string' ? activity.object : activity.object.id;

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

	await follow(actor, followee, activity);
};
