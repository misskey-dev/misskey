import $ from 'cafy'; import ID from '../../../../../misc/cafy-id';
import DriveFolder, { isValidFolderName, pack } from '../../../../../models/drive-folder';
import { publishDriveStream } from '../../../../../stream';
import { ILocalUser } from '../../../../../models/user';
import getParams from '../../../get-params';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': 'ドライブのフォルダを作成します。',
		'en-US': 'Create a folder of drive.'
	},

	requireCredential: true,

	kind: 'drive-write',

	params: {
		name: $.str.optional.pipe(isValidFolderName).note({
			default: 'Untitled',
			desc: {
				'ja-JP': 'フォルダ名',
				'en-US': 'Folder name'
			}
		}),

		parentId: $.type(ID).optional.nullable.note({
			desc: {
				'ja-JP': '親フォルダID',
				'en-US': 'Parent folder ID'
			}
		})
	}
};

export default (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) return rej(psErr);

	// If the parent folder is specified
	let parent = null;
	if (ps.parentId) {
		// Fetch parent folder
		parent = await DriveFolder
			.findOne({
				_id: ps.parentId,
				userId: user._id
			});

		if (parent === null) {
			return rej('parent-not-found');
		}
	}

	// Create folder
	const folder = await DriveFolder.insert({
		createdAt: new Date(),
		name: ps.name,
		parentId: parent !== null ? parent._id : null,
		userId: user._id
	});

	// Serialize
	const folderObj = await pack(folder);

	// Response
	res(folderObj);

	// Publish folderCreated event
	publishDriveStream(user._id, 'folderCreated', folderObj);
});
