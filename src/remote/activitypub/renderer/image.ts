import { DriveFile } from '../../../models/entities/drive-file';
import getDriveFileUrl from '../../../misc/get-drive-file-url';

export default (file: DriveFile) => ({
	type: 'Image',
	url: getDriveFileUrl(file),
	sensitive: file.metadata.isSensitive
});
