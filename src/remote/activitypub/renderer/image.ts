import config from '../../../config';
import { IDriveFile } from '../../../models/drive-file';

export default (file: IDriveFile) => ({
	type: 'Image',
	url: file.metadata.url || `${config.drive_url}/${file._id}`,
	sensitive: file.metadata.isSensitive
});
