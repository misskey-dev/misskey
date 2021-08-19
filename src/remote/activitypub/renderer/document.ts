import { DriveFile } from '@/models/entities/drive-file.js';
import { DriveFiles } from '@/models/index.js';

export default (file: DriveFile) => ({
	type: 'Document',
	mediaType: file.type,
	url: DriveFiles.getPublicUrl(file),
	name: file.comment,
});
