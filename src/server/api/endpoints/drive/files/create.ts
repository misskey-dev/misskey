import * as ms from 'ms';
import $ from 'cafy';
import ID, { transform } from '../../../../../misc/cafy-id';
import { validateFileName, pack } from '../../../../../models/drive-file';
import create from '../../../../../services/drive/add-file';
import define from '../../../define';
import { apiLogger } from '../../../logger';

export const meta = {
	desc: {
		'ja-JP': 'ドライブにファイルをアップロードします。',
		'en-US': 'Upload a file to drive.'
	},

	requireCredential: true,

	limit: {
		duration: ms('1hour'),
		max: 120
	},

	requireFile: true,

	kind: 'drive-write',

	params: {
		folderId: {
			validator: $.optional.nullable.type(ID),
			transform: transform,
			default: null as any,
			desc: {
				'ja-JP': 'フォルダID'
			}
		},

		isSensitive: {
			validator: $.optional.or($.bool, $.str),
			default: false,
			transform: (v: any): boolean => v === true || v === 'true',
			desc: {
				'ja-JP': 'このメディアが「閲覧注意」(NSFW)かどうか',
				'en-US': 'Whether this media is NSFW'
			}
		},

		force: {
			validator: $.optional.or($.bool, $.str),
			default: false,
			transform: (v: any): boolean => v === true || v === 'true',
			desc: {
				'ja-JP': 'true にすると、同じハッシュを持つファイルが既にアップロードされていても強制的にファイルを作成します。',
			}
		}
	}
};

export default define(meta, (ps, user, app, file, cleanup) => new Promise(async (res, rej) => {
	// Get 'name' parameter
	let name = file.originalname;
	if (name !== undefined && name !== null) {
		name = name.trim();
		if (name.length === 0) {
			name = null;
		} else if (name === 'blob') {
			name = null;
		} else if (!validateFileName(name)) {
			return rej('invalid name');
		}
	} else {
		name = null;
	}

	try {
		// Create file
		const driveFile = await create(user, file.path, name, null, ps.folderId, ps.force, false, null, null, ps.isSensitive);

		cleanup();

		res(pack(driveFile, { self: true }));
	} catch (e) {
		apiLogger.error(e);

		cleanup();

		rej(e);
	}
}));
