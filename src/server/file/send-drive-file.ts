import * as Koa from 'koa';
import * as send from 'koa-send';
import * as rename from 'rename';
import { serverLogger } from '..';
import { contentDisposition } from '../../misc/content-disposition';
import { DriveFiles } from '../../models';
import { InternalStorage } from '../../services/drive/internal-storage';

const assets = `${__dirname}/../../server/file/assets/`;

const commonReadableHandlerGenerator = (ctx: Koa.Context) => (e: Error): void => {
	serverLogger.error(e);
	ctx.status = 500;
	ctx.set('Cache-Control', 'max-age=300');
};

export default async function(ctx: Koa.Context) {
	const key = ctx.params.key;

	// Fetch drive file
	const file = await DriveFiles.createQueryBuilder('file')
		.where('file.accessKey = :accessKey', { accessKey: key })
		.orWhere('file.thumbnailAccessKey = :thumbnailAccessKey', { thumbnailAccessKey: key })
		.orWhere('file.webpublicAccessKey = :webpublicAccessKey', { webpublicAccessKey: key })
		.getOne();

	if (file == null) {
		ctx.status = 404;
		ctx.set('Cache-Control', 'max-age=86400');
		await send(ctx as any, '/dummy.png', { root: assets });
		return;
	}

	if (!file.storedInternal) {
		ctx.status = 204;
		ctx.set('Cache-Control', 'max-age=86400');
		return;
	}

	const isThumbnail = file.thumbnailAccessKey === key;
	const isWebpublic = file.webpublicAccessKey === key;

	if (isThumbnail) {
		ctx.body = InternalStorage.read(key);
		ctx.set('Content-Type', 'image/jpeg');
		ctx.set('Cache-Control', 'max-age=31536000, immutable');
		ctx.set('Content-Disposition', contentDisposition('inline', `${rename(file.name, { suffix: '-thumb', extname: '.jpeg' })}`));
	} else if (isWebpublic) {
		ctx.body = InternalStorage.read(key);
		ctx.set('Content-Type', file.type === 'image/apng' ? 'image/png' : file.type);
		ctx.set('Cache-Control', 'max-age=31536000, immutable');
		ctx.set('Content-Disposition', contentDisposition('inline', `${rename(file.name, { suffix: '-web' })}`));
	} else {
		const readable = InternalStorage.read(file.accessKey!);
		readable.on('error', commonReadableHandlerGenerator(ctx));
		ctx.body = readable;
		ctx.set('Content-Type', file.type);
		ctx.set('Cache-Control', 'max-age=31536000, immutable');
		ctx.set('Content-Disposition', contentDisposition('inline', `${file.name}`));
	}
}
