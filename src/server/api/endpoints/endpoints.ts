import define from '../define';
import endpoints from '../endpoints';

export const meta = {
	requireCredential: false as const,

	tags: ['meta'],

	params: {
	},
};

export default define(meta, async () => {
	return endpoints.map(x => x.name);
});
