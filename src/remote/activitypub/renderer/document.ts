import { IDriveFile } from '../../../models/drive-file';

export default (file: IDriveFile) => ({
	type: 'Document',
	mediaType: file.contentType,
	url: file.metadata.webpublicUrl
});
