import renderImage from './image';
import renderKey from './key';
import config from '../../../conf';

export default user => {
	const id = `${config.url}/@${user.username}`;

	return {
		type: 'Person',
		id,
		inbox: `${id}/inbox`,
		outbox: `${id}/outbox`,
		preferredUsername: user.username,
		name: user.name,
		summary: user.description,
		icon: user.avatarId && renderImage({ _id: user.avatarId }),
		image: user.bannerId && renderImage({ _id: user.bannerId }),
		publicKey: renderKey(user)
	};
};
