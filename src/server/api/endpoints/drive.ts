import define from '../define';
import fetchMeta from '../../../misc/fetch-meta';
import { DriveFiles } from '../../../models';

export const meta = {
	desc: {
		'ja-JP': 'ドライブの情報を取得します。',
		'en-US': 'Get drive information.'
	},

	tags: ['drive', 'account'],

	requireCredential: true,

	kind: 'read:drive',

	res: {
		type: 'object',
		properties: {
			capacity: {
				type: 'number'
			},
			usage: {
				type: 'number'
			}
		}
	}
};

export default define(meta, async (ps, user) => {
	const instance = await fetchMeta();

	// Calculate drive usage
	const usage = await DriveFiles.clacDriveUsageOf(user);

	return {
		capacity: 1024 * 1024 * instance.localDriveCapacityMb,
		usage: usage
	};
});
