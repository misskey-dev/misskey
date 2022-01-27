import define from '../../../define';
import { createCleanRemoteFilesJob } from '@/queue/index';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, me) => {
	createCleanRemoteFilesJob();
});
