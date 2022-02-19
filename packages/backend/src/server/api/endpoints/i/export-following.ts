import define from '../../define';
import { createExportFollowingJob } from '@/queue/index';
import ms from 'ms';

export const meta = {
	secure: true,
	requireCredential: true,
	limit: {
		duration: ms('1hour'),
		max: 1,
	},
} as const;

const paramDef = {
	type: 'object',
	properties: {
		excludeMuting: { type: 'boolean', default: false },
		excludeInactive: { type: 'boolean', default: false },
	},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	createExportFollowingJob(user, ps.excludeMuting, ps.excludeInactive);
});
