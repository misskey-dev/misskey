import { DriveFile } from '@/models/entities/drive-file';
import { DriveFiles } from '@/models/index';

export default (file: DriveFile) => ({
	type: 'Image',
	url: DriveFiles.getPublicUrl(file),
	sensitive: file.isSensitive,
	name: file.comment
});
