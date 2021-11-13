import $ from 'cafy';
import define from '../define';
import { ApiError } from '../error';
import { resetDb } from '@/db/postgre';

export const meta = {
	requireCredential: false as const,

	params: {
	},

	errors: {

	}
};

export default define(meta, async (ps, user) => {
	if (process.env.NODE_ENV !== 'test') throw 'NODE_ENV is not a test';

	await resetDb();

	await new Promise(resolve => setTimeout(resolve, 1000));
});
