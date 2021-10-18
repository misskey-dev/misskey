import * as fs from 'fs';
import * as Koa from 'koa';
import { serverLogger } from '../index';
import { IReadableImage, convertToPng, convertToJpeg } from '@/services/drive/image-processor';
import { downloadUrl, getUrl } from '@/misc/download-url';
import { detectType } from '@/misc/get-file-info';
import { StatusError } from '@/misc/fetch';
import { PassThrough } from 'stream';

export async function proxyMedia(ctx: Koa.Context) {
	const url = 'url' in ctx.query ? ctx.query.url : 'https://' + ctx.params.url;

	if (typeof url !== 'string') throw 403;

	try {
		const readable = getUrl(url);

		const { mime, ext } = await detectType(readable);

		if (!mime.startsWith('image/')) throw 403;

		let image: IReadableImage;

		if ('static' in ctx.query && ['image/png', 'image/gif', 'image/apng', 'image/vnd.mozilla.apng', 'image/webp'].includes(mime)) {
			image = convertToPng(readable, 498, 280);
		} else if ('preview' in ctx.query && ['image/jpeg', 'image/png', 'image/gif', 'image/apng', 'image/vnd.mozilla.apng'].includes(mime)) {
			image = convertToJpeg(readable, 200, 200);
		} else {
			image = {
				readable: readable,
				ext,
				type: mime,
			};
		}

		ctx.set('Content-Type', image.type);
		ctx.set('Cache-Control', 'max-age=31536000, immutable');
		ctx.body = image.readable;
	} catch (e) {
		serverLogger.error(`${e}`);

		if (e instanceof StatusError && e.isClientError) {
			ctx.status = e.statusCode;
		} else {
			ctx.status = 500;
		}
	}
}
