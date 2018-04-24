/**
 * Module dependencies
 */
import $ from 'cafy'; import ID from '../../../../../cafy-id';
import { pack } from '../../../../../models/drive-file';
import uploadFromUrl from '../../../../../services/drive/upload-from-url';

/**
 * Create a file from a URL
 */
module.exports = async (params, user): Promise<any> => {
	// Get 'url' parameter
	// TODO: Validate this url
	const [url, urlErr] = $(params.url).string().$;
	if (urlErr) throw 'invalid url param';

	// Get 'folderId' parameter
	const [folderId = null, folderIdErr] = $(params.folderId).optional.nullable.type(ID).$;
	if (folderIdErr) throw 'invalid folderId param';

	return pack(await uploadFromUrl(url, user, folderId));
};
