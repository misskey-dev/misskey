import config from '../../../config';

export default tag => ({
	type: 'Hashtag',
	href: `${config.url}/search?q=#${encodeURIComponent(tag)}`,
	name: '#' + tag
});
