import $ from 'cafy'; import ID from '../../../../../misc/cafy-id';
const ms = require('ms');
import { pack } from '../../../../../models/drive-file';
import uploadFromUrl from '../../../../../services/drive/upload-from-url';
import { ILocalUser } from '../../../../../models/user';

export const meta = {
	desc: {
		'ja-JP': 'ドライブに指定されたURLに存在するファイルをアップロードします。'
	},

	limit: {
		duration: ms('1hour'),
		max: 10
	},

	requireCredential: true,

	kind: 'drive-write'
};

/**
 * Create a file from a URL
 */
export default async (params: any, user: ILocalUser): Promise<any> => {
	// Get 'url' parameter
	// TODO: Validate this url
	const [url, urlErr] = $.str.get(params.url);
	if (urlErr) throw 'invalid url param';

	// Get 'folderId' parameter
	const [folderId = null, folderIdErr] = $.type(ID).optional.nullable.get(params.folderId);
	if (folderIdErr) throw 'invalid folderId param';

	return pack(await uploadFromUrl(url, user, folderId));
};
