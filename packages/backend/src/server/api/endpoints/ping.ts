import define from '../define';

export const meta = {
	requireCredential: false,

	tags: ['meta'],

	params: {
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			pong: {
				type: 'number',
				optional: false, nullable: false,
			},
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async () => {
	return {
		pong: Date.now(),
	};
});
