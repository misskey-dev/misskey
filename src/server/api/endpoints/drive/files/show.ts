import $ from 'cafy';
import * as mongo from 'mongodb';
import ID, { transform } from '../../../../../misc/cafy-id';
import DriveFile, { pack, IDriveFile } from '../../../../../models/drive-file';
import define from '../../../define';
import config from '../../../../../config';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': '指定したドライブのファイルの情報を取得します。',
		'en-US': 'Get specified file of drive.'
	},

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
	}
};

export default define(meta, (ps, user) => new Promise(async (res, rej) => {
	let file: IDriveFile;

	if (ps.fileId) {
		file = await DriveFile.findOne({
			_id: ps.fileId,
			'metadata.deletedAt': { $exists: false }
		});
	} else if (ps.url) {
		const isInternalStorageUrl = ps.url.startsWith(config.drive_url);
		if (isInternalStorageUrl) {
			// Extract file ID from url
			// e.g.
			// http://misskey.local/files/foo?original=bar --> foo
			const fileId = new mongo.ObjectID(ps.url.replace(config.drive_url, '').replace(/\?(.*)$/, '').replace(/\//g, ''));
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
		return rej('fileId or url required');
	}

	if (!user.isAdmin && !user.isModerator && !file.metadata.userId.equals(user._id)) {
		return rej('access denied');
	}

	if (file === null) {
		return rej('file-not-found');
	}

	// Serialize
	const _file = await pack(file, {
		detail: true,
		self: true
	});

	res(_file);
}));
