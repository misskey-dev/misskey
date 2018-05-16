import renderImage from './image';
import renderKey from './key';
import config from '../../../config';

export default user => {
	const id = `${config.url}/users/${user._id}`;

	return {
		type: 'Person',
		id,
		inbox: `${id}/inbox`,
		outbox: `${id}/outbox`,
		sharedInbox: `${config.url}/inbox`,
		url: `${config.url}/@${user.username}`,
		preferredUsername: user.username,
		name: user.name,
		summary: user.description,
		icon: user.avatarId && renderImage({ _id: user.avatarId }),
		image: user.bannerId && renderImage({ _id: user.bannerId }),
		publicKey: renderKey(user)
	};
};
