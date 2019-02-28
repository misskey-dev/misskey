import { IDriveFile } from '../../../models/drive-file';

export default (file: IDriveFile) => ({
	type: 'Image',
	url: file.metadata.webpublicUrl,
	sensitive: file.metadata.isSensitive
});
