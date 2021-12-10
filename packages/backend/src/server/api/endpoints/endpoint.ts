import $ from 'cafy';
import define from '../define';
import endpoints from '../endpoints';

export const meta = {
	requireCredential: false as const,

	tags: ['meta'],

	params: {
		endpoint: {
			validator: $.str,
		},
	},
};

export default define(meta, async (ps) => {
	const ep = endpoints.find(x => x.name === ps.endpoint);
	if (ep == null) return null;
	return {
		params: Object.entries(ep.meta.params || {}).map(([k, v]) => ({
			name: k,
			type: v.validator.name === 'ID' ? 'String' : v.validator.name,
		})),
	};
});
