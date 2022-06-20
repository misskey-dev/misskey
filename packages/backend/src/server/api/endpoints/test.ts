import define from '../define.js';

export const meta = {
	tags: ['non-productive'],

	description: 'Endpoint for testing input validation.',

	requireCredential: false,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		required: { type: 'boolean' },
		string: { type: 'string' },
		default: { type: 'string', default: 'hello' },
		nullableDefault: { type: 'string', nullable: true, default: 'hello' },
		id: { type: 'string', format: 'misskey:id' },
	},
	required: ['required'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, me) => {
	return ps;
});
