import define from '../define';
import { fetchMeta } from '../../../misc/fetch-meta';
import { DriveFiles } from '../../../models';
import { types, bool } from '../../../misc/schema';

export const meta = {
	desc: {
		'ja-JP': 'ドライブの情報を取得します。',
		'en-US': 'Get drive information.'
	},

	tags: ['drive', 'account'],

	requireCredential: true,

	kind: 'read:drive',

	res: {
		type: types.object,
		optional: bool.false, nullable: bool.false,
		properties: {
			capacity: {
				type: types.number,
				optional: bool.false, nullable: bool.false,
			},
			usage: {
				type: types.number,
				optional: bool.false, nullable: bool.false,
			}
		}
	}
};

export default define(meta, async (ps, user) => {
	const instance = await fetchMeta(true);

	// Calculate drive usage
	const usage = await DriveFiles.clacDriveUsageOf(user);

	return {
		capacity: 1024 * 1024 * instance.localDriveCapacityMb,
		usage: usage
	};
});
