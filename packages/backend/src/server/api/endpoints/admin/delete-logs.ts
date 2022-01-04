import define from '../../define';
import { Logs } from '@/models/index';

export const meta = {
	tags: ['admin'],

	requireCredential: true as const,
	requireModerator: true,
};

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps) => {
	await Logs.clear();	// TRUNCATE
});
