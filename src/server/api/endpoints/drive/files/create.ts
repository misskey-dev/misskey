/**
 * Module dependencies
 */
import $ from 'cafy';
import { validateFileName, pack } from '../../../../../models/drive-file';
import create from '../../../common/drive/add-file';

/**
 * Create a file
 *
 * @param {any} file
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = async (file, params, user): Promise<any> => {
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

	// Get 'folderId' parameter
	const [folderId = null, folderIdErr] = $(params.folderId).optional.nullable.id().$;
	if (folderIdErr) throw 'invalid folderId param';

	try {
		// Create file
		const driveFile = await create(user, file.path, name, null, folderId);

		// Serialize
		return pack(driveFile);
	} catch (e) {
		console.error(e);

		throw e;
	}
};
