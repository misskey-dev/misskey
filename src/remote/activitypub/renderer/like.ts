import config from '../../../config';

export default (user, post) => {
	return {
		type: 'Like',
		actor: `${config.url}/@${user.username}`,
		object: post.uri ? post.uri : `${config.url}/posts/${post._id}`
	};
};
