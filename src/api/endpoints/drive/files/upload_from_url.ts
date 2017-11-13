/**
 * Module dependencies
 */
import * as URL from 'url';
import $ from 'cafy';
import { validateFileName } from '../../../models/drive-file';
import serialize from '../../../serializers/drive-file';
import create from '../../../common/add-file-to-drive';
import * as debug from 'debug';
import * as tmp from 'tmp';
import * as fs from 'fs';
import * as request from 'request';
import * as crypto from 'crypto';

const log = debug('misskey:endpoint:upload_from_url');

/**
 * Create a file from a URL
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise((res, rej) => {
	// Get 'url' parameter
	// TODO: Validate this url
	const [url, urlErr] = $(params.url).string().$;
	if (urlErr) return rej('invalid url param');

	let name = URL.parse(url).pathname.split('/').pop();
	if (!validateFileName(name)) {
		name = null;
	}

	// Get 'folder_id' parameter
	const [folderId = null, folderIdErr] = $(params.folder_id).optional.nullable.id().$;
	if (folderIdErr) return rej('invalid folder_id param');

	// Create temp file
	new Promise((res, rej) => {
		tmp.file((e, path) => {
			if (e) return rej(e);
			res(path);
		});
	})
		// Download file
		.then((path: string) => new Promise((res, rej) => {
			const writable = fs.createWriteStream(path);
			request(url)
				.on('error', rej)
				.on('end', () => {
					writable.close();
					res(path);
				})
				.pipe(writable)
				.on('error', rej);
		}))
		// Calculate hash & content-type
		.then((path: string) => new Promise((res, rej) => {
			const readable = fs.createReadStream(path);
			const hash = crypto.createHash('md5');
			readable
				.on('error', rej)
				.on('end', () => {
					hash.end();
					res([path, hash.digest('hex')]);
				})
				.pipe(hash)
				.on('error', rej);
		}))
		// Create file
		.then((rv: string[]) => new Promise((res, rej) => {
			const [path, hash] = rv;
			create(user, {
				stream: fs.createReadStream(path),
				name,
				hash
			}, null, folderId)
				.then(driveFile => {
					res(driveFile);
					// crean-up
					fs.unlink(path, (e) => {
						if (e) log(e.stack);
					});
				})
				.catch(rej);
		}))
		// Serialize
		.then(serialize)
		.then(res)
		.catch(rej);
});
