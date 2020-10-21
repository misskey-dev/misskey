import define from '../../../define';
import { createCleanRemoteFilesJob } from '../../../../../queue';

export const meta = {
	desc: {
		'ja-JP': 'キャッシュされたリモートファイルをすべて削除します。',
		'en-US': 'Deletes all cached remote files.'
	},

	tags: ['admin'],

	requireCredential: true as const,
	requireModerator: true,
};

export default define(meta, async (ps, me) => {
	createCleanRemoteFilesJob();
});
