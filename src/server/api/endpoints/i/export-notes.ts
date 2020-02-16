import define from '../../define';
import { createExportNotesJob } from '../../../../queue';
import ms = require('ms');

export const meta = {
	secure: true,
	requireCredential: true as const,
	limit: {
		duration: ms('1day'),
		max: 1,
	},
};

export default define(meta, async (ps, user) => {
	createExportNotesJob(user);
});
