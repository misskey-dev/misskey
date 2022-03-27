import define from '../define.js';
import endpoints from '../endpoints.js';

export const meta = {
	requireCredential: false,

	tags: ['meta'],
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		endpoint: { type: 'string' },
	},
	required: ['endpoint'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps) => {
	const ep = endpoints.find(x => x.name === ps.endpoint);
	if (ep == null) return null;
	return {
		params: Object.entries(ep.params.properties || {}).map(([k, v]) => ({
			name: k,
			type: v.type.charAt(0).toUpperCase() + v.type.slice(1),
		})),
	};
});
