import * as Koa from 'koa';
import * as send from 'koa-send';
import DriveFile, { getDriveFileBucket } from '../../models/drive-file';
import DriveFileThumbnail, { getDriveFileThumbnailBucket } from '../../models/drive-file-thumbnail';
import DriveFileWebpublic, { getDriveFileWebpublicBucket } from '../../models/drive-file-webpublic';
import { serverLogger } from '..';

const assets = `${__dirname}/../../server/file/assets/`;

const commonReadableHandlerGenerator = (ctx: Koa.BaseContext) => (e: Error): void => {
	serverLogger.error(e);
	ctx.status = 500;
};

export default async function(ctx: Koa.BaseContext) {
	const url = ctx.href;

	// Fetch drive file
	const file = await DriveFile.findOne({
		$or: [{
			'metadata.url': url
		}, {
			'metadata.webpublicUrl': url
		}, {
			'metadata.thumbnailUrl': url
		}],
	});

	if (file == null) {
		ctx.status = 404;
		await send(ctx as any, '/dummy.png', { root: assets });
		return;
	}

	if (file.metadata.deletedAt) {
		ctx.status = 410;
		await send(ctx as any, '/tombstone.png', { root: assets });
		return;
	}

	if (file.metadata.withoutChunks) {
		ctx.status = 204;
		return;
	}

	const sendRaw = async () => {
		const bucket = await getDriveFileBucket();
		const readable = bucket.openDownloadStream(file._id);
		readable.on('error', commonReadableHandlerGenerator(ctx));
		ctx.set('Content-Type', file.contentType);
		ctx.body = readable;
	};

	if (file.metadata.thumbnailUrl === url) {
		const thumb = await DriveFileThumbnail.findOne({
			'metadata.originalId': file._id
		});

		if (thumb != null) {
			ctx.set('Content-Type', 'image/jpeg');
			const bucket = await getDriveFileThumbnailBucket();
			ctx.body = bucket.openDownloadStream(thumb._id);
		} else {
			if (file.contentType.startsWith('image/')) {
				await sendRaw();
			} else {
				ctx.status = 404;
				await send(ctx as any, '/dummy.png', { root: assets });
			}
		}
	} else if (file.metadata.webpublicUrl === url) {
		const web = await DriveFileWebpublic.findOne({
			'metadata.originalId': file._id
		});

		if (web != null) {
			ctx.set('Content-Type', file.contentType);

			const bucket = await getDriveFileWebpublicBucket();
			ctx.body = bucket.openDownloadStream(web._id);
		} else {
			await sendRaw();
		}
	} else {
		if ('download' in ctx.query) {
			ctx.set('Content-Disposition', 'attachment');
		}

		await sendRaw();
	}
}
