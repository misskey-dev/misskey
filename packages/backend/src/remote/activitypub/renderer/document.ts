import { DriveFile } from '@/models/entities/drive-file';
import { DriveFiles } from '@/models/index';

export default (file: DriveFile) => ({
	type: 'Document',
	mediaType: file.type,
	url: DriveFiles.getPublicUrl(file),
	name: file.comment,
});
