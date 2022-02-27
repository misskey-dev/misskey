import define from '../define.js';
import { ApiError } from '../error.js';
import { resetDb } from '@/db/postgre.js';

export const meta = {
	requireCredential: false,

	errors: {

	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	if (process.env.NODE_ENV !== 'test') throw 'NODE_ENV is not a test';

	await resetDb();

	await new Promise(resolve => setTimeout(resolve, 1000));
});
