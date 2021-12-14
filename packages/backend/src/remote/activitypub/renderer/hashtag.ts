import config from '@/config/index';

export default (tag: string) => ({
	type: 'Hashtag',
	href: `${config.url}/tags/${encodeURIComponent(tag)}`,
	name: `#${tag}`,
});
