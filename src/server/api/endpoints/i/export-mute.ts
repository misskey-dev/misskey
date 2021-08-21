import define from '../../define';
import { createExportMuteJob } from '@/queue/index';
import * as ms from 'ms';

export const meta = {
	secure: true,
	requireCredential: true as const,
	limit: {
		duration: ms('1hour'),
		max: 1,
	},
};

export default define(meta, async (ps, user) => {
	createExportMuteJob(user);
});
