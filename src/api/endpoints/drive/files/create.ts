/**
 * Module dependencies
 */
import * as fs from 'fs';
import $ from 'cafy';
import { validateFileName } from '../../../models/drive-file';
import serialize from '../../../serializers/drive-file';
import create from '../../../common/add-file-to-drive';

/**
 * Create a file
 *
 * @param {any} file
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (file, params, user) => new Promise(async (res, rej) => {
	if (file == null) {
		return rej('file is required');
	}

	// TODO: 非同期にしたい。Promise対応してないんだろうか...
	const buffer = fs.readFileSync(file.path);
	fs.unlink(file.path, (err) => { if (err) console.log(err); });

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

	// Get 'folder_id' parameter
	const [folderId = null, folderIdErr] = $(params.folder_id).optional.nullable.id().$;
	if (folderIdErr) return rej('invalid folder_id param');

	// Create file
	const driveFile = await create(user, buffer, name, null, folderId);

	// Serialize
	const fileObj = await serialize(driveFile);

	// Response
	res(fileObj);
});
