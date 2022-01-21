import * as fs from 'fs';
import * as Koa from 'koa';
import { serverLogger } from '../index';
import { IImage, convertToPng, convertToJpeg } from '@/services/drive/image-processor';
import { createTemp } from '@/misc/create-temp';
import { downloadUrl } from '@/misc/download-url';
import { detectType } from '@/misc/get-file-info';
import { StatusError } from '@/misc/fetch';
import * as sharp from 'sharp';
import { FILE_TYPE_BROWSERSAFE } from '@/const';

export async function proxyMedia(ctx: Koa.Context) {
	const url = 'url' in ctx.query ? ctx.query.url : 'https://' + ctx.params.url;

	// Create temp file
	const [path, cleanup] = await createTemp();

	try {
		await downloadUrl(url, path);

		const { mime, ext } = await detectType(path);

		let image: IImage;

		if ('static' in ctx.query && ['image/png', 'image/gif', 'image/apng', 'image/vnd.mozilla.apng', 'image/webp', 'image/svg+xml'].includes(mime)) {
			image = await convertToPng(path, 498, 280);
		} else if ('preview' in ctx.query && ['image/jpeg', 'image/png', 'image/gif', 'image/apng', 'image/vnd.mozilla.apng', 'image/svg+xml'].includes(mime)) {
			image = await convertToJpeg(path, 200, 200);
		} else if ('badge' in ctx.query) {
			if (!['image/jpeg', 'image/png', 'image/gif', 'image/apng', 'image/vnd.mozilla.apng', 'image/webp', 'image/svg+xml'].includes(mime)) {
				// 画像でないなら404でお茶を濁す
				throw new StatusError('Unexpected mime', 404);
			}

			const mask = sharp(path)
				.resize(96, 96, {
					fit: 'inside',
					withoutEnlargement: false
				})
				.normalise(true)
				.clone()
				.flatten({ background: '#000' })
				.threshold(120)
				.toColourspace('b-w');

			const stats = await mask.clone().stats();

			if (stats.entropy < 0.1) {
				// エントロピーがあまりない場合は404にする
				throw new StatusError('Skip to provide badge', 404);
			}

			const data = sharp(
				{ create: { width: 96, height: 96, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }
			)
				.boolean(await mask.png().toBuffer(), 'eor');

			image = {
				data: await data.png().toBuffer(),
				ext: 'png',
				type: 'image/png'
			};
		}	else if (['image/svg+xml'].includes(mime)) {
			image = await convertToPng(path, 2048, 2048);
		} else if (!mime.startsWith('image/') || !FILE_TYPE_BROWSERSAFE.includes(mime)) {
			throw new StatusError('Rejected type', 403, 'Rejected type');
		} else {
			image = {
				data: fs.readFileSync(path),
				ext,
				type: mime,
			};
		}

		ctx.set('Content-Type', image.type);
		ctx.set('Cache-Control', 'max-age=31536000, immutable');
		ctx.body = image.data;
	} catch (e) {
		serverLogger.error(`${e}`);

		if (e instanceof StatusError && (e.statusCode === 302 || e.isClientError)) {
			ctx.status = e.statusCode;
		} else {
			ctx.status = 500;
		}
	} finally {
		cleanup();
	}
}
