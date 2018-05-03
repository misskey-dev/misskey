import * as fs from 'fs';

import * as Koa from 'koa';
import * as send from 'koa-send';
import * as mongodb from 'mongodb';
import DriveFile, { getDriveFileBucket } from '../../models/drive-file';
import DriveFileThumbnail, { getDriveFileThumbnailBucket } from '../../models/drive-file-thumbnail';

const commonReadableHandlerGenerator = (ctx: Koa.Context) => (e: Error): void => {
	console.error(e);
	ctx.status = 500;
};

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

	if (file.metadata.deletedAt) {
		ctx.status = 410;
		await send(ctx, `${__dirname}/assets/tombstone.png`);
		return;
	}

	const sendRaw = async () => {
		const bucket = await getDriveFileBucket();
		const readable = bucket.openDownloadStream(fileId);
		readable.on('error', commonReadableHandlerGenerator(ctx));
		ctx.set('Content-Type', file.contentType);
		ctx.body = readable;
	};

	if ('thumbnail' in ctx.query) {
		// 画像以外
		if (!file.contentType.startsWith('image/')) {
			const readable = fs.createReadStream(`${__dirname}/assets/thumbnail-not-available.png`);
			ctx.set('Content-Type', 'image/png');
			ctx.body = readable;
		} else if (file.contentType == 'image/gif') {
			// GIF
			await sendRaw();
		} else {
			const thumb = await DriveFileThumbnail.findOne({ 'metadata.originalId': fileId });
			if (thumb != null) {
				ctx.set('Content-Type', 'image/jpeg');
				const bucket = await getDriveFileThumbnailBucket();
				ctx.body = bucket.openDownloadStream(thumb._id);
			} else {
				await sendRaw();
			}
		}
	} else {
		if ('download' in ctx.query) {
			ctx.set('Content-Disposition', 'attachment');
		}

		await sendRaw();
	}
}
