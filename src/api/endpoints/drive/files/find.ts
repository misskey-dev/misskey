/**
 * Module dependencies
 */
import it from 'cafy';
import DriveFile from '../../../models/drive-file';
import serialize from '../../../serializers/drive-file';

/**
 * Find a file(s)
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'name' parameter
	const [name, nameErr] = it(params.name).expect.string().required().get();
	if (nameErr) return rej('invalid name param');

	// Get 'folder_id' parameter
	const [folderId = null, folderIdErr] = it(params.folder_id).expect.nullable.id().get();
	if (folderIdErr) return rej('invalid folder_id param');

	// Issue query
	const files = await DriveFile
		.find({
			name: name,
			user_id: user._id,
			folder_id: folderId
		}, {
			fields: {
				data: false
			}
		});

	// Serialize
	res(await Promise.all(files.map(async file =>
		await serialize(file))));
});
