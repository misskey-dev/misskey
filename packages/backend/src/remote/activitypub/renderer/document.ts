import { DriveFile } from '@/models/entities/drive-file';
import { DriveFiles } from '@/models/index';

export default (file: DriveFile) => ({
	type: 'Document',
	mediaType: file.type,
	url: DriveFiles.getPublicUrl(file),
	name: file.comment,
	...(file.blurhash ? { blurhash: file.blurhash } : {}),
	...(file.properties.width ? { width: file.properties.width } : {}),
	...(file.properties.height ? { height: file.properties.height } : {}),
});
