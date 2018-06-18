import config from '../../../config';
import { IDriveFile } from '../../../models/drive-file';

export default (fileId: IDriveFile['_id']) => ({
	type: 'Image',
	url: `${config.drive_url}/${fileId}`
});
