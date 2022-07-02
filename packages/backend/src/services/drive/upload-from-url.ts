import { URL } from 'node:url';
import { User } from '@/models/entities/user.js';
import { createTemp } from '@/misc/create-temp.js';
import { downloadUrl } from '@/misc/download-url.js';
import { DriveFolder } from '@/models/entities/drive-folder.js';
import { DriveFile } from '@/models/entities/drive-file.js';
import { DriveFiles } from '@/models/index.js';
import { driveLogger } from './logger.js';
import { addFile } from './add-file.js';

const logger = driveLogger.createSubLogger('downloader');

type Args = {
	url: string;
	user: { id: User['id']; host: User['host'] } | null;
	folderId?: DriveFolder['id'] | null;
	uri?: string | null;
	sensitive?: boolean;
	force?: boolean;
	isLink?: boolean;
	comment?: string | null;
	requestIp?: string | null;
	requestHeaders?: Record<string, string> | null;
};

export async function uploadFromUrl({
	url,
	user,
	folderId = null,
	uri = null,
	sensitive = false,
	force = false,
	isLink = false,
	comment = null,
	requestIp = null,
	requestHeaders = null,
}: Args): Promise<DriveFile> {
	let name = new URL(url).pathname.split('/').pop() || null;
	if (name == null || !DriveFiles.validateFileName(name)) {
		name = null;
	}

	// If the comment is same as the name, skip comment
	// (image.name is passed in when receiving attachment)
	if (comment !== null && name === comment) {
		comment = null;
	}

	// Create temp file
	const [path, cleanup] = await createTemp();

	try {
		// write content at URL to temp file
		await downloadUrl(url, path);

		const driveFile = await addFile({ user, path, name, comment, folderId, force, isLink, url, uri, sensitive, requestIp, requestHeaders });
		logger.succ(`Got: ${driveFile.id}`);
		return driveFile!;
	} catch (e) {
		logger.error(`Failed to create drive file: ${e}`, {
			url: url,
			e: e,
		});
		throw e;
	} finally {
		cleanup();
	}
}
