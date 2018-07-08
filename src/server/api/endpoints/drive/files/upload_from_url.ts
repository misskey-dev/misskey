/**
 * Module dependencies
 */
import $ from 'cafy'; import ID from '../../../../../misc/cafy-id';
import { pack } from '../../../../../models/drive-file';
import uploadFromUrl from '../../../../../services/drive/upload-from-url';
import { ILocalUser } from '../../../../../models/user';

/**
 * Create a file from a URL
 */
export default async (params: any, user: ILocalUser): Promise<any> => {
	// Get 'url' parameter
	// TODO: Validate this url
	const [url, urlErr] = $.str.get(params.url);
	if (urlErr) throw 'invalid url param';

	// Get 'folderId' parameter
	const [folderId = null, folderIdErr] = $.type(ID).optional.nullable.get(params.folderId);
	if (folderIdErr) throw 'invalid folderId param';

	return pack(await uploadFromUrl(url, user, folderId));
};
