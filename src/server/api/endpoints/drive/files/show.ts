import $ from 'cafy';
import { ObjectID } from 'mongodb';
import ID, { transform } from '../../../../../misc/cafy-id';
import DriveFile, { pack } from '../../../../../models/drive-file';
import define from '../../../define';
import { error } from '../../../../../prelude/promise';
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
			validator: $.type(ID).optional,
			transform: transform,
			desc: {
				'ja-JP': '対象のファイルID',
				'en-US': 'Target file ID'
			}
		},

		url: {
			validator: $.str.optional,
			desc: {
				'ja-JP': '対象のファイルのURL',
				'en-US': 'Target file URL'
			}
		}
	}
};

const fromExternalUrl = (href: string) => ({
		$or: [
			{ 'metadata.url': href },
			{ 'metadata.webpublicUrl': href },
			{ 'metadata.thumbnailUrl': href }
		]
	});

const fromInternalUrl = (url: URL) =>
	({ _id: new ObjectID(url.pathname.split('/').filter(x => x).reverse()[0]) });

const fromUrl = (url: URL) => url.href.startsWith(config.drive_url) ?
	fromInternalUrl(url) :
	fromExternalUrl(url.href);

const fromId = (_id: ObjectID, userId: ObjectID) => ({
		_id,
		'metadata.userId': userId,
	});

export default define(meta, (ps, user) => DriveFile.findOne({
		'metadata.deletedAt': { $exists: false },
		...(
			ps.fileId ? fromId(ps.fileId, user._id) :
			ps.url ? fromUrl(new URL(ps.url)) : error('fileId or url required'))
	})
	.then(x =>
		!user.isAdmin && !user.isModerator && !x.metadata.userId.equals(user._id) ? error('access denied') :
		x === null ? error('file-not-found') :
		pack(x, {
			detail: true,
			self: true
		})));
