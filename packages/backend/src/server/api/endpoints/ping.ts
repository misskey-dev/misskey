import define from '../define';

export const meta = {
	requireCredential: false as const,

	tags: ['meta'],

	params: {
	},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		properties: {
			pong: {
				type: 'number' as const,
				optional: false as const, nullable: false as const,
			},
		},
	},
};

// eslint-disable-next-line import/no-default-export
export default define(meta, async () => {
	return {
		pong: Date.now(),
	};
});
