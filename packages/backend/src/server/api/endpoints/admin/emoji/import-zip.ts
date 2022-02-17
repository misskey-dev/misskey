import define from '../../../define';
import { createImportCustomEmojisJob } from '@/queue/index';
import ms from 'ms';

export const meta = {
	secure: true,
	requireCredential: true,
	requireModerator: true,
	params: {
		type: 'object',
		properties: {
			fileId: { type: 'string', format: 'misskey:id', },
		},
		required: ['fileId'],
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, user) => {
	createImportCustomEmojisJob(user, ps.fileId);
});
