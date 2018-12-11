import { IDriveFile } from '../models/drive-file';
import config from '../config';

export default function(file: IDriveFile, thumbnail = false): string {
	return file && (file.metadata.withoutChunks ?
		thumbnail ?
			file.metadata.thumbnailUrl || file.metadata.webpublicUrl || file.metadata.url :
			file.metadata.webpublicUrl || file.metadata.url :
		thumbnail ?
			`${config.drive_url}/${file._id}?thumbnail` :
			`${config.drive_url}/${file._id}?web`);
}

export function getOriginalUrl(file: IDriveFile) {
	if (file.metadata && file.metadata.url)
		return file.metadata.url;

	const accessKey = file.metadata && file.metadata.accessKey;
	return `${config.drive_url}/${file._id}${accessKey ? '?original=' + accessKey : ''}`;
}
