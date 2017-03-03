/**
 * Module dependencies
 */
import it from '../../../it';
import DriveFolder from '../../../models/drive-folder';
import serialize from '../../../serializers/drive-folder';

/**
 * Find a folder(s)
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'name' parameter
	const [name, nameErr] = it(params.name).expect.string().required().qed();
	if (nameErr) return rej('invalid name param');

	// Get 'parent_id' parameter
	const [parentId, parentIdErr] = it(params.parent_id).expect.id().qed();
	if (parentIdErr) return rej('invalid parent_id param');

	// Issue query
	const folders = await DriveFolder
		.find({
			name: name,
			user_id: user._id,
			parent_id: parentId
		});

	// Serialize
	res(await Promise.all(folders.map(async folder =>
		await serialize(folder))));
});
