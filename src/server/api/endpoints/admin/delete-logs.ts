import define from '../../define.js';
import { Logs } from '@/models/index.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true as const,
	requireModerator: true,
};

export default define(meta, async (ps) => {
	await Logs.clear();	// TRUNCATE
});
