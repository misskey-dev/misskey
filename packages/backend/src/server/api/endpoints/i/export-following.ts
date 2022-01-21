import $ from 'cafy';
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
	params: {
		excludeMuting: {
			validator: $.optional.bool,
			default: false,
		},
		excludeInactive: {
			validator: $.optional.bool,
			default: false,
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, user) => {
	createExportFollowingJob(user, ps.excludeMuting, ps.excludeInactive);
});
