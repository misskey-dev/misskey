import { IDriveFile } from '../../../models/drive-file';
import getDriveFileUrl from '../../../misc/get-drive-file-url';

export default (file: IDriveFile) => ({
	type: 'Image',
	url: getDriveFileUrl(file),
	sensitive: file.metadata.isSensitive
});
