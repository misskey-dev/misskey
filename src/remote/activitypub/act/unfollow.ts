import parseAcct from '../../../acct/parse';
import User from '../../../models/user';
import config from '../../../config';
import unfollow from '../../../services/following/delete';

export default async (actor, activity): Promise<void> => {
	const prefix = config.url + '/@';
	const id = activity.object.id || activity.object;

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
