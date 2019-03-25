import { DriveFile } from '../../../models/entities/drive-file';
import { DriveFiles } from '../../../models';

export default (file: DriveFile) => ({
	type: 'Document',
	mediaType: file.contentType,
	url: DriveFiles.getPublicUrl(file)
});
