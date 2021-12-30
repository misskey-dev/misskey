import $ from 'cafy';
import define from '../../define';
import { createExportFollowingJob } from '@/queue/index';
import ms from 'ms';

export const meta = {
	secure: true,
	requireCredential: true as const,
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
};

export default define(meta, async (ps, user) => {
	createExportFollowingJob(user, ps.excludeMuting, ps.excludeInactive);
});
