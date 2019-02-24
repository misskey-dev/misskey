import $ from 'cafy';
import * as mongo from 'mongodb';
import ID, { transform } from '../../../../../misc/cafy-id';
import DriveFile, { pack, IDriveFile } from '../../../../../models/drive-file';
import define from '../../../define';
import config from '../../../../../config';
import { ApiError } from '../../../error';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': '指定したドライブのファイルの情報を取得します。',
		'en-US': 'Get specified file of drive.'
	},

	tags: ['drive'],

	requireCredential: true,

	kind: 'drive-read',

	params: {
		fileId: {
			validator: $.optional.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '対象のファイルID',
				'en-US': 'Target file ID'
			}
		},

		url: {
			validator: $.optional.str,
			desc: {
				'ja-JP': '対象のファイルのURL',
				'en-US': 'Target file URL'
			}
		}
	},

	res: {
		type: 'DriveFile',
	},

	errors: {
		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: '067bc436-2718-4795-b0fb-ecbe43949e31'
		},

		accessDenied: {
			message: 'Access denied.',
			code: 'ACCESS_DENIED',
			id: '25b73c73-68b1-41d0-bad1-381cfdf6579f'
		},

		fileIdOrUrlRequired: {
			message: 'fileId or url required.',
			code: 'INVALID_PARAM',
			id: '89674805-722c-440c-8d88-5641830dc3e4'
		}
	}
};

export default define(meta, async (ps, user) => {
	let file: IDriveFile;

	if (ps.fileId) {
		file = await DriveFile.findOne({
			_id: ps.fileId,
			'metadata.deletedAt': { $exists: false }
		});
	} else if (ps.url) {
		const isInternalStorageUrl = ps.url.startsWith(config.driveUrl);
		if (isInternalStorageUrl) {
			// Extract file ID from url
			// e.g.
			// http://misskey.local/files/foo?original=bar --> foo
			const fileId = new mongo.ObjectID(ps.url.replace(config.driveUrl, '').replace(/\?(.*)$/, '').replace(/\//g, ''));
			file = await DriveFile.findOne({
				_id: fileId,
				'metadata.deletedAt': { $exists: false }
			});
		} else {
			file = await DriveFile.findOne({
				$or: [{
					'metadata.url': ps.url
				}, {
					'metadata.webpublicUrl': ps.url
				}, {
					'metadata.thumbnailUrl': ps.url
				}],
				'metadata.deletedAt': { $exists: false }
			});
		}
	} else {
		throw new ApiError(meta.errors.fileIdOrUrlRequired);
	}

	if (!user.isAdmin && !user.isModerator && !file.metadata.userId.equals(user._id)) {
		throw new ApiError(meta.errors.accessDenied);
	}

	if (file === null) {
		throw new ApiError(meta.errors.noSuchFile);
	}

	return await pack(file, {
		detail: true,
		self: true
	});
});
