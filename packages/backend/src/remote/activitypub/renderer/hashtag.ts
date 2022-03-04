import config from '@/config/index.js';

export default (tag: string) => ({
	type: 'Hashtag',
	href: `${config.url}/tags/${encodeURIComponent(tag)}`,
	name: `#${tag}`,
});
