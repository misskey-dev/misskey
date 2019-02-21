import define from '../../define';
import { createExportFollowingJob } from '../../../../queue';
import ms = require('ms');

export const meta = {
	secure: true,
	requireCredential: true,
	limit: {
		duration: ms('1hour'),
		max: 1,
	},
};

export default define(meta, async (ps, user) => {
	createExportFollowingJob(user);

	return;
});
