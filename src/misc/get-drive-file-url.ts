import { IDriveFile } from '../models/drive-file';
import config from '../config';

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
