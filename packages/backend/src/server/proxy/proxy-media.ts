import * as fs from 'fs';
import * as Koa from 'koa';
import { serverLogger } from '../index';
import { IImage, convertToWebp } from '@/services/drive/image-processor';
import { createTemp } from '@/misc/create-temp';
import { downloadUrl } from '@/misc/download-url';
import { detectType } from '@/misc/get-file-info';
import { StatusError } from '@/misc/fetch';
import { FILE_TYPE_BROWSERSAFE } from '@/const';
import * as cors from '@koa/cors';
import * as Router from '@koa/router';

// Init app
const app = new Koa();
app.use(cors());
app.use(async (ctx, next) => {
	ctx.set('Content-Security-Policy', `default-src 'none'; img-src 'self'; media-src 'self'; style-src 'unsafe-inline'`);
	await next();
});

// Init router
const router = new Router();

router.get('/:url*', proxyMedia);

// Register router
app.use(router.routes());

module.exports = app;

async function proxyMedia(ctx: Koa.Context) {
	const url = 'url' in ctx.query ? ctx.query.url : 'https://' + ctx.params.url;

	if (typeof url !== 'string') {
		ctx.status = 400;
		return;
	}

	// Create temp file
	const [path, cleanup] = await createTemp();

	try {
		await downloadUrl(url, path);

		const { mime, ext } = await detectType(path);

		let image: IImage;

		if ('static' in ctx.query && ['image/png', 'image/gif', 'image/apng', 'image/vnd.mozilla.apng', 'image/webp', 'image/svg+xml'].includes(mime)) {
			image = await convertToWebp(path, 498, 280);
		} else if ('preview' in ctx.query && ['image/jpeg', 'image/png', 'image/gif', 'image/apng', 'image/vnd.mozilla.apng', 'image/svg+xml'].includes(mime)) {
			image = await convertToWebp(path, 200, 200);
		}	else if (['image/svg+xml'].includes(mime)) {
			image = await convertToWebp(path, 2048, 2048, 1);
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

		if (e instanceof StatusError && e.isClientError) {
			ctx.status = e.statusCode;
		} else {
			ctx.status = 500;
		}
	} finally {
		cleanup();
	}
}
