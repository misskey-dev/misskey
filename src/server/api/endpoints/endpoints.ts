import define from '~/server/api/define';
import endpoints from '~/server/api/endpoints';

export const meta = {
	requireCredential: false,

	tags: ['meta'],

	params: {
	},
};

export default define(meta, async () => {
	return endpoints.map(x => x.name);
});
