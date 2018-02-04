/**
 * Module dependencies
 */
import * as URL from 'url';
import $ from 'cafy';
import { validateFileName, pack } from '../../../models/drive-file';
import create from '../../../common/add-file-to-drive';
import * as debug from 'debug';
import * as tmp from 'tmp';
import * as fs from 'fs';
import * as request from 'request';

const log = debug('misskey:endpoint:upload_from_url');

/**
 * Create a file from a URL
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = async (params, user): Promise<any> => {
	// Get 'url' parameter
	// TODO: Validate this url
	const [url, urlErr] = $(params.url).string().$;
	if (urlErr) throw 'invalid url param';

	let name = URL.parse(url).pathname.split('/').pop();
	if (!validateFileName(name)) {
		name = null;
	}

	// Get 'folder_id' parameter
	const [folderId = null, folderIdErr] = $(params.folder_id).optional.nullable.id().$;
	if (folderIdErr) throw 'invalid folder_id param';

	// Create temp file
	const path = await new Promise((res: (string) => void, rej) => {
		tmp.file((e, path) => {
			if (e) return rej(e);
			res(path);
		});
	});

	// write content at URL to temp file
	await new Promise((res, rej) => {
		const writable = fs.createWriteStream(path);
		request(url)
			.on('error', rej)
			.on('end', () => {
				writable.close();
				res(path);
			})
			.pipe(writable)
			.on('error', rej);
	});

	const driveFile = await create(user, path, name, null, folderId);

	// clean-up
	fs.unlink(path, (e) => {
		if (e) log(e.stack);
	});

	return pack(driveFile);
};
