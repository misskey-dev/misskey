import config from '../../../config';

export default (tag: string) => ({
	type: 'Hashtag',
	href: `${config.url}/tags/${encodeURIComponent(tag)}`,
	name: `#${tag}`
});
