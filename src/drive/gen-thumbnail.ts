import * as stream from 'stream';
import * as Gm from 'gm';
import { IDriveFile, getDriveFileBucket } from '../models/drive-file';

const gm = Gm.subClass({
	imageMagick: true
});

export default async function(file: IDriveFile): Promise<stream.Readable> {
	if (!/^image\/.*$/.test(file.contentType)) return null;

	const bucket = await getDriveFileBucket();
	const readable = bucket.openDownloadStream(file._id);

	const g = gm(readable);

	const stream = g
		.resize(256, 256)
		.compress('jpeg')
		.quality(70)
		.interlace('line')
		.stream();

	return stream;
}
