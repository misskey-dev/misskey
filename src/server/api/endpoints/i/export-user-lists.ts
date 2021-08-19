import define from '../../define.js';
import { createExportUserListsJob } from '@/queue/index.js';
import * as ms from 'ms';

export const meta = {
	secure: true,
	requireCredential: true as const,
	limit: {
		duration: ms('1min'),
		max: 1,
	},
};

export default define(meta, async (ps, user) => {
	createExportUserListsJob(user);
});
