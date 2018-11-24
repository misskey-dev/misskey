import { IDriveFile } from '../models/drive-file';
import config from '../config';
import DriveFileOriginal from '../models/drive-file-original';

export default function(file: IDriveFile, thumbnail = false): string {
	if (file == null) return null;

	if (file.metadata.withoutChunks) {
		if (thumbnail) {
			return file.metadata.thumbnailUrl || file.metadata.url;
		} else {
			return file.metadata.url;
		}
	} else {
		if (thumbnail) {
			return `${config.drive_url}/${file._id}?thumbnail`;
		} else {
			return `${config.drive_url}/${file._id}`;
		}
	}
}

export async function getOriginalUrl(file: IDriveFile) {
	if (file.metadata && file.metadata.originalUrl) {
		return file.metadata.originalUrl;
	}

	const original = await DriveFileOriginal.findOne({
		'metadata.originalId': file._id
	});

	if (original) {
		const accessKey = original.metadata ? original.metadata.accessKey : null;
		return `${config.drive_url}/${file._id}${accessKey ? '?original=' + accessKey : ''}`;
	}

	return `${config.drive_url}/${file._id}`;
}
