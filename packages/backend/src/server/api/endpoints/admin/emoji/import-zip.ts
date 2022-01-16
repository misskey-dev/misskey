import $ from 'cafy';
import define from '../../../define';
import { createImportCustomEmojisJob } from '@/queue/index';
import ms from 'ms';
import { ID } from '@/misc/cafy-id';

export const meta = {
	secure: true,
	requireCredential: true as const,
	requireModerator: true,
	params: {
		fileId: {
			validator: $.type(ID),
		},
	},
};

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, user) => {
	createImportCustomEmojisJob(user, ps.fileId);
});
