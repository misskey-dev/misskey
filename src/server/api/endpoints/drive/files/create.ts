/**
 * Module dependencies
 */
import * as fs from 'fs';
import $ from 'cafy'; import ID from '../../../../../cafy-id';
import { validateFileName, pack } from '../../../../../models/drive-file';
import create from '../../../../../services/drive/add-file';

/**
 * Create a file
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
	const [folderId = null, folderIdErr] = $.type(ID).optional().nullable().get(params.folderId);
	if (folderIdErr) throw 'invalid folderId param';

	function cleanup() {
		fs.unlink(file.path, () => {});
	}

	try {
		// Create file
		const driveFile = await create(user, file.path, name, null, folderId);

		cleanup();

		// Serialize
		return pack(driveFile);
	} catch (e) {
		console.error(e);

		cleanup();

		throw e;
	}
};
