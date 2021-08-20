import define from '../../../define';
import { createCleanRemoteFilesJob } from '@/queue/index';

export const meta = {
	tags: ['admin'],

	requireCredential: true as const,
	requireModerator: true,
};

export default define(meta, async (ps, me) => {
	createCleanRemoteFilesJob();
});
