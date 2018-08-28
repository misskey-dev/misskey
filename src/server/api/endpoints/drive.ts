import DriveFile from '../../../models/drive-file';
import { ILocalUser } from '../../../models/user';
import config from '../../../config';

export const meta = {
	desc: {
		'ja-JP': 'ドライブの情報を取得します。',
		'en-US': 'Get drive information.'
	},

	requireCredential: true,

	kind: 'drive-read'
};

export default (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	// Calculate drive usage
	const usage = await DriveFile
		.aggregate([{
			$match: {
				'metadata.userId': user._id,
				'metadata.deletedAt': { $exists: false }
			}
		}, {
			$project: {
				length: true
			}
		}, {
			$group: {
				_id: null,
				usage: { $sum: '$length' }
			}
		}])
		.then((aggregates: any[]) => {
			if (aggregates.length > 0) {
				return aggregates[0].usage;
			}
			return 0;
		});

	res({
		capacity: 1024 * 1024 * config.localDriveCapacityMb,
		usage: usage
	});
});
