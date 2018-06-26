import renderImage from './image';
import renderKey from './key';
import config from '../../../config';
import { ILocalUser } from '../../../models/user';
import toHtml from '../../../mfm/html';
import parse from '../../../mfm/parse';

export default (user: ILocalUser) => {
	const id = `${config.url}/users/${user._id}`;

	return {
		type: user.isBot ? 'Service' : 'Person',
		id,
		inbox: `${id}/inbox`,
		outbox: `${id}/outbox`,
		sharedInbox: `${config.url}/inbox`,
		url: `${config.url}/@${user.username}`,
		preferredUsername: user.username,
		name: user.name,
		summary: toHtml(parse(user.description)),
		icon: user.avatarId && renderImage(user.avatarId),
		image: user.bannerId && renderImage(user.bannerId),
		manuallyApprovesFollowers: user.isLocked,
		publicKey: renderKey(user)
	};
};
