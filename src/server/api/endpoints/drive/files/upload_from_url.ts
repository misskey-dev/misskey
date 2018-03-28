/**
 * Module dependencies
 */
import $ from 'cafy';
import { pack } from '../../../models/drive-file';
import uploadFromUrl from '../../../common/drive/upload_from_url';

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

	// Get 'folder_id' parameter
	const [folderId = null, folderIdErr] = $(params.folder_id).optional.nullable.id().$;
	if (folderIdErr) throw 'invalid folder_id param';

	return pack(await uploadFromUrl(url, user, folderId));
};
