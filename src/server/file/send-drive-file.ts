import * as Koa from 'koa';
import * as send from 'koa-send';
import * as rename from 'rename';
import { serverLogger } from '..';
import { contentDisposition } from '../../misc/content-disposition';
import { DriveFiles } from '../../models';
import { InternalStorage } from '../../services/drive/internal-storage';

const assets = `${__dirname}/../../server/file/assets/`;

const commonReadableHandlerGenerator = (ctx: Koa.BaseContext) => (e: Error): void => {
	serverLogger.error(e);
	ctx.status = 500;
};

export default async function(ctx: Koa.BaseContext) {
	const key = ctx.params.key;

	// Fetch drive file
	const file = await DriveFiles.createQueryBuilder('file')
		.where('file.accessKey = :accessKey', { accessKey: key })
		.orWhere('file.thumbnailAccessKey = :thumbnailAccessKey', { thumbnailAccessKey: key })
		.orWhere('file.webpublicAccessKey = :webpublicAccessKey', { webpublicAccessKey: key })
		.getOne();

	if (file == null) {
		ctx.status = 404;
		await send(ctx as any, '/dummy.png', { root: assets });
		return;
	}

	if (!file.storedInternal) {
		ctx.status = 204;
		return;
	}

	const isThumbnail = file.thumbnailAccessKey === key;
	const isWebpublic = file.webpublicAccessKey === key;

	if (isThumbnail) {
		ctx.set('Content-Type', 'image/jpeg');
		ctx.set('Content-Disposition', contentDisposition('inline', `${rename(file.name, { suffix: '-thumb', extname: '.jpeg' })}`));
		ctx.body = InternalStorage.read(key);
	} else if (isWebpublic) {
		ctx.set('Content-Type', file.type === 'image/apng' ? 'image/png' : file.type);
		ctx.set('Content-Disposition', contentDisposition('inline', `${rename(file.name, { suffix: '-web' })}`));
		ctx.body = InternalStorage.read(key);
	} else {
		ctx.set('Content-Disposition', contentDisposition('inline', `${file.name}`));

		const readable = InternalStorage.read(file.accessKey!);
		readable.on('error', commonReadableHandlerGenerator(ctx));
		ctx.set('Content-Type', file.type);
		ctx.body = readable;
	}
}
