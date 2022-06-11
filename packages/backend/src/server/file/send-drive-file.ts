import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import Koa from 'koa';
import send from 'koa-send';
import rename from 'rename';
import { serverLogger } from '../index.js';
import { contentDisposition } from '@/misc/content-disposition.js';
import { DriveFiles } from '@/models/index.js';
import { InternalStorage } from '@/services/drive/internal-storage.js';
import { createTemp } from '@/misc/create-temp.js';
import { downloadUrl } from '@/misc/download-url.js';
import { detectType } from '@/misc/get-file-info.js';
import { convertToWebp, convertToJpeg, convertToPng } from '@/services/drive/image-processor.js';
import { GenerateVideoThumbnail } from '@/services/drive/generate-video-thumbnail.js';
import { StatusError } from '@/misc/fetch.js';
import { FILE_TYPE_BROWSERSAFE } from '@/const.js';

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);

const assets = `${_dirname}/../../server/file/assets/`;

const commonReadableHandlerGenerator = (ctx: Koa.Context) => (e: Error): void => {
	serverLogger.error(e);
	ctx.status = 500;
	ctx.set('Cache-Control', 'max-age=300');
};

// eslint-disable-next-line import/no-default-export
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
			const [path, cleanup] = await createTemp();

			try {
				await downloadUrl(file.uri, path);

				const { mime, ext } = await detectType(path);

				const convertFile = async () => {
					if (isThumbnail) {
						if (['image/jpeg', 'image/webp', 'image/png', 'image/svg+xml'].includes(mime)) {
							return await convertToWebp(path, 498, 280);
						} else if (mime.startsWith('video/')) {
							return await GenerateVideoThumbnail(path);
						}
					}

					if (isWebpublic) {
						if (['image/svg+xml'].includes(mime)) {
							return await convertToPng(path, 2048, 2048);
						}
					}

					return {
						data: fs.readFileSync(path),
						ext,
						type: mime,
					};
				};

				const image = await convertFile();
				ctx.body = image.data;
				ctx.set('Content-Type', FILE_TYPE_BROWSERSAFE.includes(image.type) ? image.type : 'application/octet-stream');
				ctx.set('Cache-Control', 'max-age=31536000, immutable');
			} catch (e) {
				serverLogger.error(`${e}`);

				if (e instanceof StatusError && e.isClientError) {
					ctx.status = e.statusCode;
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

	if (isThumbnail || isWebpublic) {
		const { mime, ext } = await detectType(InternalStorage.resolvePath(key));
		const filename = rename(file.name, {
			suffix: isThumbnail ? '-thumb' : '-web',
			extname: ext ? `.${ext}` : undefined,
		}).toString();

		ctx.body = InternalStorage.read(key);
		ctx.set('Content-Type', FILE_TYPE_BROWSERSAFE.includes(mime) ? mime : 'application/octet-stream');
		ctx.set('Cache-Control', 'max-age=31536000, immutable');
		ctx.set('Content-Disposition', contentDisposition('inline', filename));
	} else {
		const readable = InternalStorage.read(file.accessKey!);
		readable.on('error', commonReadableHandlerGenerator(ctx));
		ctx.body = readable;
		ctx.set('Content-Type', FILE_TYPE_BROWSERSAFE.includes(file.type) ? file.type : 'application/octet-stream');
		ctx.set('Cache-Control', 'max-age=31536000, immutable');
		ctx.set('Content-Disposition', contentDisposition('inline', file.name));
	}
}
