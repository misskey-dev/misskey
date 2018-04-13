import * as Koa from 'koa';
import * as send from 'koa-send';
import * as mongodb from 'mongodb';
import DriveFile, { getGridFSBucket } from '../../models/drive-file';
import pour from './pour';

export default async function(ctx: Koa.Context) {
	// Validate id
	if (!mongodb.ObjectID.isValid(ctx.params.id)) {
		ctx.throw(400, 'incorrect id');
		return;
	}

	const fileId = new mongodb.ObjectID(ctx.params.id);

	// Fetch drive file
	const file = await DriveFile.findOne({ _id: fileId });

	if (file == null) {
		ctx.status = 404;
		await send(ctx, `${__dirname}/assets/dummy.png`);
		return;
	}

	const bucket = await getGridFSBucket();

	const readable = bucket.openDownloadStream(fileId);

	pour(readable, file.contentType, ctx);
}
