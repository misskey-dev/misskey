import * as fs from 'fs';
import * as URL from 'url';
import * as tmp from 'tmp';
import * as Koa from 'koa';
import * as request from 'request';
import * as fileType from 'file-type';
import { serverLogger } from '..';
import config from '../../config';
import { IImage, ConvertToPng } from '../../services/drive/image-processor';
import checkSvg from '../../misc/check-svg';

export async function proxyMedia(ctx: Koa.BaseContext) {
	const url = 'url' in ctx.query ? ctx.query.url : 'https://' + ctx.params.url;

	// Create temp file
	const [path, cleanup] = await new Promise<[string, any]>((res, rej) => {
		tmp.file((e, path, fd, cleanup) => {
			if (e) return rej(e);
			res([path, cleanup]);
		});
	});

	try {
		await fetch(url, path);

		const [type, ext] = await detectMine(path);

		let image: IImage;

		if ('static' in ctx.query && ['image/png', 'image/gif'].includes(type)) {
			image = await ConvertToPng(path, 498, 280);
		} else {
			image = {
				data: fs.readFileSync(path),
				ext,
				type,
			};
		}

		ctx.set('Content-Type', type);
		ctx.set('Cache-Control', 'max-age=31536000, immutable');
		ctx.body = image.data;
	} catch (e) {
		serverLogger.error(e);

		if (typeof e == 'number' && e >= 400 && e < 500) {
			ctx.status = e;
		} else {
			ctx.status = 500;
		}
	} finally {
		cleanup();
	}
}

async function fetch(url: string, path: string) {
	await new Promise((res, rej) => {
		const writable = fs.createWriteStream(path);

		writable.on('finish', () => {
			res();
		});

		writable.on('error', error => {
			rej(error);
		});

		const requestUrl = URL.parse(url).pathname.match(/[^\u0021-\u00ff]/) ? encodeURI(url) : url;

		const req = request({
			url: requestUrl,
			proxy: config.proxy,
			timeout: 10 * 1000,
			headers: {
				'User-Agent': config.userAgent
			}
		});

		req.pipe(writable);

		req.on('response', response => {
			if (response.statusCode !== 200) {
				writable.close();
				rej(response.statusCode);
			}
		});

		req.on('error', error => {
			writable.close();
			rej(error);
		});
	});
}

async function detectMine(path: string) {
	return new Promise<[string, string]>((res, rej) => {
		const readable = fs.createReadStream(path);
		readable
			.on('error', rej)
			.once('data', (buffer: Buffer) => {
				readable.destroy();
				const type = fileType(buffer);
				if (type) {
					if (type.mime == 'application/xml' && checkSvg(path)) {
						res(['image/svg+xml', 'svg']);
					} else {
						res([type.mime, type.ext]);
					}
				} else if (checkSvg(path)) {
					res(['image/svg+xml', 'svg']);
				} else {
					// 種類が同定できなかったら application/octet-stream にする
					res(['application/octet-stream', null]);
				}
			})
			.on('end', () => {
				// maybe 0 bytes
				res(['application/octet-stream', null]);
			});
	});
}
