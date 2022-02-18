import define from '../define';

export const meta = {
	requireCredential: false,

	params: {
		type: 'object',
		properties: {
			required: { type: 'boolean', },
			string: { type: 'string', },
			default: { type: 'string', default: 'hello', },
			nullableDefault: { type: 'string', nullable: true, default: 'hello', },
			id: { type: 'string', format: 'misskey:id', },
		},
		required: ['required'],
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, me) => {
	return ps;
});
