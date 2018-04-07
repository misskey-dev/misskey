import config from '../../../config';

export default (user, note) => {
	return {
		type: 'Like',
		actor: `${config.url}/@${user.username}`,
		object: note.uri ? note.uri : `${config.url}/notes/${note._id}`
	};
};
