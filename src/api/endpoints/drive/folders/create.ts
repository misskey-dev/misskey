/**
 * Module dependencies
 */
import it from '../../../it';
import DriveFolder from '../../../models/drive-folder';
import { isValidFolderName } from '../../../models/drive-folder';
import serialize from '../../../serializers/drive-folder';
import event from '../../../event';

/**
 * Create drive folder
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'name' parameter
	const [name, nameErr] = it(params.name).expect.string().validate(isValidFolderName).default('無題のフォルダー').qed();
	if (nameErr) return rej('invalid name param');

	// Get 'parent_id' parameter
	const [parentId, parentIdErr] = it(params.parent_id).expect.nullable.id().default(null).qed();
	if (parentIdErr) return rej('invalid parent_id param');

	// If the parent folder is specified
	let parent = null;
	if (parentId) {
		// Fetch parent folder
		parent = await DriveFolder
			.findOne({
				_id: parentId,
				user_id: user._id
			});

		if (parent === null) {
			return rej('parent-not-found');
		}
	}

	// Create folder
	const folder = await DriveFolder.insert({
		created_at: new Date(),
		name: name,
		parent_id: parent !== null ? parent._id : null,
		user_id: user._id
	});

	// Serialize
	const folderObj = await serialize(folder);

	// Response
	res(folderObj);

	// Publish drive_folder_created event
	event(user._id, 'drive_folder_created', folderObj);
});
