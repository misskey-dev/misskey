import define from '../../../define';
import { createCleanRemoteFilesJob } from '../../../../../queue';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
};

export default define(meta, async (ps, me) => {
	createCleanRemoteFilesJob();
});
