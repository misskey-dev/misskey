import * as URL from 'url';

import { IDriveFile, validateFileName } from '../../models/drive-file';
import create from './add-file';
import { IUser } from '../../models/user';
import * as mongodb from 'mongodb';
import { driveLogger } from './logger';
import { createTemp } from '../../misc/create-temp';
import { downloadUrl } from '../../misc/donwload-url';

const logger = driveLogger.createSubLogger('downloader');

export default async (
	url: string,
	user: IUser,
	folderId: mongodb.ObjectID = null,
	uri: string = null,
	sensitive = false,
	force = false,
	link = false
): Promise<IDriveFile> => {
	let name = URL.parse(url).pathname.split('/').pop();
	if (!validateFileName(name)) {
		name = null;
	}

	// Create temp file
	const [path, cleanup] = await createTemp();

	// write content at URL to temp file
	await downloadUrl(url, path);

	let driveFile: IDriveFile;
	let error;

	try {
		driveFile = await create(user, path, name, null, folderId, force, link, url, uri, sensitive);
		logger.succ(`Got: ${driveFile._id}`);
	} catch (e) {
		error = e;
		logger.error(`Failed to create drive file: ${e}`, {
			url: url,
			e: e
		});
	}

	// clean-up
	cleanup();

	if (error) {
		throw error;
	} else {
		return driveFile;
	}
};
