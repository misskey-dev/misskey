import define from '../../define';
import { createExportUserListsJob } from '../../../../queue';
import ms = require('ms');

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
