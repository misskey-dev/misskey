import $ from 'cafy'; import ID from '../../../../misc/cafy-id';
import DriveFile, { pack } from '../../../../models/drive-file';
import { ILocalUser } from '../../../../models/user';

export const meta = {
	desc: {
		'ja-JP': 'ドライブのファイル一覧を取得します。',
		'en-US': 'Get files of drive.'
	},

	requireCredential: true,

	kind: 'drive-read'
};

export default async (params: any, user: ILocalUser) => {
	// Get 'limit' parameter
	const [limit = 10, limitErr] = $.num.optional.range(1, 100).get(params.limit);
	if (limitErr) throw 'invalid limit param';

	// Get 'sinceId' parameter
	const [sinceId, sinceIdErr] = $.type(ID).optional.get(params.sinceId);
	if (sinceIdErr) throw 'invalid sinceId param';

	// Get 'untilId' parameter
	const [untilId, untilIdErr] = $.type(ID).optional.get(params.untilId);
	if (untilIdErr) throw 'invalid untilId param';

	// Check if both of sinceId and untilId is specified
	if (sinceId && untilId) {
		throw 'cannot set sinceId and untilId';
	}

	// Get 'folderId' parameter
	const [folderId = null, folderIdErr] = $.type(ID).optional.nullable.get(params.folderId);
	if (folderIdErr) throw 'invalid folderId param';

	// Get 'type' parameter
	const [type, typeErr] = $.str.optional.match(/^[a-zA-Z\/\-\*]+$/).get(params.type);
	if (typeErr) throw 'invalid type param';

	// Construct query
	const sort = {
		_id: -1
	};

	const query = {
		'metadata.userId': user._id,
		'metadata.folderId': folderId,
		'metadata.deletedAt': { $exists: false }
	} as any;

	if (sinceId) {
		sort._id = 1;
		query._id = {
			$gt: sinceId
		};
	} else if (untilId) {
		query._id = {
			$lt: untilId
		};
	}

	if (type) {
		query.contentType = new RegExp(`^${type.replace(/\*/g, '.+?')}$`);
	}

	// Issue query
	const files = await DriveFile
		.find(query, {
			limit: limit,
			sort: sort
		});

	// Serialize
	const _files = await Promise.all(files.map(file => pack(file)));
	return _files;
};
