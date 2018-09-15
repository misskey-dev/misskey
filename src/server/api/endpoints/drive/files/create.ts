import * as fs from 'fs';
const ms = require('ms');
import $ from 'cafy'; import ID from '../../../../../misc/cafy-id';
import { validateFileName, pack } from '../../../../../models/drive-file';
import create from '../../../../../services/drive/add-file';
import { ILocalUser } from '../../../../../models/user';
import getParams from '../../../get-params';

export const meta = {
	desc: {
		'ja-JP': 'ドライブにファイルをアップロードします。',
		'en-US': 'Upload a file to drive.'
	},

	requireCredential: true,

	limit: {
		duration: ms('1hour'),
		max: 100
	},

	requireFile: true,

	kind: 'drive-write',

	params: {
		folderId: $.type(ID).optional.nullable.note({
			default: null,
			desc: {
				'ja-JP': 'フォルダID'
			}
		}),

		isSensitive: $.bool.optional.nullable.note({
			default: null,
			desc: {
				'ja-JP': 'このメディアが「閲覧注意」(NSFW)かどうか',
				'en-US': 'Whether this media is NSFW'
			}
		})
	}
};

/**
 * Create a file
 */
export default async (file: any, params: any, user: ILocalUser): Promise<any> => {
	if (file == null) {
		throw 'file is required';
	}

	// Get 'name' parameter
	let name = file.originalname;
	if (name !== undefined && name !== null) {
		name = name.trim();
		if (name.length === 0) {
			name = null;
		} else if (name === 'blob') {
			name = null;
		} else if (!validateFileName(name)) {
			throw 'invalid name';
		}
	} else {
		name = null;
	}

	function cleanup() {
		fs.unlink(file.path, () => {});
	}

	const [ps, psErr] = getParams(meta, params);
	if (psErr) {
		cleanup();
		throw psErr;
	}

	try {
		// Create file
		const driveFile = await create(user, file.path, name, null, ps.folderId, false, false, null, null, ps.isSensitive);

		cleanup();

		// Serialize
		return pack(driveFile);
	} catch (e) {
		console.error(e);

		cleanup();

		throw e;
	}
};
