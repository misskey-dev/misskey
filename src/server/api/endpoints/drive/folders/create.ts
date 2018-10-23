import $ from 'cafy'; import ID from '../../../../../misc/cafy-id';
import DriveFolder, { isValidFolderName, pack } from '../../../../../models/drive-folder';
import { publishDriveStream } from '../../../../../stream';
import { ILocalUser } from '../../../../../models/user';

export const meta = {
	desc: {
		'ja-JP': 'ドライブのフォルダを作成します。',
		'en-US': 'Create a folder of drive.'
	},

	requireCredential: true,

	kind: 'drive-write'
};

export default (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	// Get 'name' parameter
	const [name = '無題のフォルダー', nameErr] = $.str.optional.pipe(isValidFolderName).get(params.name);
	if (nameErr) return rej('invalid name param');

	// Get 'parentId' parameter
	const [parentId = null, parentIdErr] = $.type(ID).optional.nullable.get(params.parentId);
	if (parentIdErr) return rej('invalid parentId param');

	// If the parent folder is specified
	let parent = null;
	if (parentId) {
		// Fetch parent folder
		parent = await DriveFolder
			.findOne({
				_id: parentId,
				userId: user._id
			});

		if (parent === null) {
			return rej('parent-not-found');
		}
	}

	// Create folder
	const folder = await DriveFolder.insert({
		createdAt: new Date(),
		name: name,
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
