import * as Koa from 'koa';
import * as send from 'koa-send';
import * as rename from 'rename';
import * as tmp from 'tmp';
import * as fs from 'fs';
import { serverLogger } from '..';
import { contentDisposition } from '../../misc/content-disposition';
import { DriveFiles } from '../../models';
import { InternalStorage } from '../../services/drive/internal-storage';
import { downloadUrl } from '../../misc/donwload-url';
import { detectMine } from '../../misc/detect-mine';
import { convertToJpeg, convertToPng, convertToGif, convertToApng } from '../../services/drive/image-processor';
import { GenerateVideoThumbnail } from '../../services/drive/generate-video-thumbnail';

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

	const isThumbnail = file.thumbnailAccessKey === key;
	const isWebpublic = file.webpublicAccessKey === key;

	if (!file.storedInternal) {
		if (file.isLink && file.uri) {	// 期限切れリモートファイル
			const [path, cleanup] = await new Promise<[string, any]>((res, rej) => {
				tmp.file((e, path, fd, cleanup) => {
					if (e) return rej(e);
					res([path, cleanup]);
				});
			});

			try {
				await downloadUrl(file.uri, path);

				const [type, ext] = await detectMine(path);

				const convertFile = async () => {
					if (isThumbnail) {
						if (['image/jpeg', 'image/webp'].includes(type)) {
							return await convertToJpeg(path, 498, 280);
						} else if (['image/png'].includes(type)) {
							return await convertToPng(path, 498, 280);
						} else if (['image/gif'].includes(type)) {
							return await convertToGif(path);
						} else if (['image/apng', 'image/vnd.mozilla.apng'].includes(type)) {
							return await convertToApng(path);
						} else if (type.startsWith('video/')) {
							return await GenerateVideoThumbnail(path);
						}
					}

					return {
						data: fs.readFileSync(path),
						ext,
						type,
					};
				};

				const image = await convertFile();
				ctx.body = image.data;
				ctx.set('Content-Type', image.type);
				ctx.set('Cache-Control', 'max-age=31536000, immutable');
			} catch (e) {
				serverLogger.error(e);

				if (typeof e == 'number' && e >= 400 && e < 500) {
					ctx.status = e;
					ctx.set('Cache-Control', 'max-age=86400');
				} else {
					ctx.status = 500;
					ctx.set('Cache-Control', 'max-age=300');
				}
			} finally {
				cleanup();
			}
			return;
		}

		ctx.status = 204;
		ctx.set('Cache-Control', 'max-age=86400');
		return;
	}

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
