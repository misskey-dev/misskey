import DriveFile from '../../../models/drive-file';
import define from '../define';
import fetchMeta from '../../../misc/fetch-meta';

export const meta = {
	desc: {
		'ja-JP': 'ドライブの情報を取得します。',
		'en-US': 'Get drive information.'
	},

	requireCredential: true,

	kind: 'drive-read'
};

export default define(meta, (_, user) => DriveFile.aggregate([{
		$match: {
			'metadata.userId': user._id,
			'metadata.deletedAt': { $exists: false }
		}
	}, {
		$project: { length: true }
	}, {
		$group: {
			_id: null,
			usage: { $sum: '$length' }
		}
	}])
	.then((aggregates: any[]) => aggregates.length ? aggregates[0].usage : 0)
	.then(usage => fetchMeta().then(x => ({
		capacity: 1024 * 1024 * x.localDriveCapacityMb,
		usage
	}))));
