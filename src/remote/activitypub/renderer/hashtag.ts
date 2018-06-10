import config from '../../../config';

export default tag => ({
	type: 'Hashtag',
	href: `${config.url}/tags/${encodeURIComponent(tag)}`,
	name: '#' + tag
});
