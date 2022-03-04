import define from '../../define.js';
import { createExportBlockingJob } from '@/queue/index.js';
import ms from 'ms';

export const meta = {
	secure: true,
	requireCredential: true,
	limit: {
		duration: ms('1hour'),
		max: 1,
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	createExportBlockingJob(user);
});
