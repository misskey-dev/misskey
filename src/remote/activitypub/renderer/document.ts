import { DriveFile } from '../../../models/entities/drive-file';
import { DriveFiles } from '../../../models';

export default (file: DriveFile) => ({
	type: 'Document',
	mediaType: file.type,
	name: file.comment || file.name,
	url: DriveFiles.getPublicUrl(file)
});
