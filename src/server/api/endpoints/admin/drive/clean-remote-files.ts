import define from '../../../define.js';
import { createCleanRemoteFilesJob } from '@/queue/index.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true as const,
	requireModerator: true,
};

export default define(meta, async (ps, me) => {
	createCleanRemoteFilesJob();
});
