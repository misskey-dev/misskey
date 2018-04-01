import config from '../../../conf';

export default tag => ({
	type: 'Hashtag',
	href: `${config.url}/search?q=#${encodeURIComponent(tag)}`,
	name: '#' + tag
});
