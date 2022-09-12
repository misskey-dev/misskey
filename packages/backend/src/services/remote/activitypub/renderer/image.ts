import { DriveFile } from '@/models/entities/drive-file.js';
import { DriveFiles } from '@/models/index.js';

export default (file: DriveFile) => ({
	type: 'Image',
	url: DriveFiles.getPublicUrl(file),
	sensitive: file.isSensitive,
	name: file.comment,
});
