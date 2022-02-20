import * as Koa from 'koa';
import { serverLogger } from '../index';
import { createTemp } from '@/misc/create-temp';
import { downloadUrl } from '@/misc/download-url';
import { detectType } from '@/misc/get-file-info';
import { StatusError } from '@/misc/fetch';
import { FILE_TYPE_BROWSERSAFE } from '@/const';
import * as Acct from 'misskey-js/built/acct';
import { Users } from '@/models/index';
import config from '@/config/index';
import * as sharp from 'sharp';
import { User } from '@/models/entities/user';
import * as cors from '@koa/cors';
import * as Router from '@koa/router';

const logger = serverLogger.createSubLogger('proxy-avatar', 'yellow');

// Init app
const app = new Koa();
app.use(cors());
app.use(async (ctx, next) => {
	ctx.set('Content-Security-Policy', `default-src 'none'; img-src 'self'; media-src 'self'; style-src 'unsafe-inline'`);
	await next();
});

// Init router
const router = new Router();

router.get('(.*)', proxyAvatar);

// Register router
app.use(router.routes());

module.exports = app;

export async function proxyAvatar(ctx: Koa.Context) {
	let user: User | undefined;

	if (ctx.query.acct) {
		if (Array.isArray(ctx.query.acct)) {
			logger.info(`acct is duplicated`);
			return ctx.redirect('/static-assets/user-unknown.png');
		};
		const { username, host } = Acct.parse(ctx.query.acct);
		user = await Users.findOne({
			usernameLower: username.toLowerCase(),
			host: host === config.host ? null : host,
			isSuspended: false,
		});
	} else if (ctx.query.userId) {
		if (Array.isArray(ctx.query.userId)) {
			logger.info(`userId is duplicated`);
			return ctx.redirect('/static-assets/user-unknown.png');
		};
		user = await Users.findOne(ctx.query.userId);
	}

	if (!user || user.isSuspended) {
		logger.info(`user is not found or is suspended: ${ctx.query}`);
		return ctx.redirect('/static-assets/user-unknown.png');
	}
	if (!user.avatarUrl) return ctx.redirect(Users.getIdenticonUrl(user));
	if (ctx.query.acct || ctx.query.url !== user.avatarUrl) {
		// 最新の、キャッシュすべきURLへリダイレクト
		logger.info(`redirect`);
		const url = new URL(ctx.URL);
		url.searchParams.set('url', user.avatarUrl);
		if (ctx.query.acct) {
			url.searchParams.delete('acct');
			url.searchParams.set('userId', user.id);
		}
		return ctx.redirect(url.toString());
	}

	// Create temp file
	const [path, cleanup] = await createTemp();

	try {
		await downloadUrl(user.avatarUrl, path);

		const { mime, ext } = await detectType(path);

		if (!mime.startsWith('image/') || !FILE_TYPE_BROWSERSAFE.includes(mime)) {
			cleanup();
			return ctx.redirect(Users.getIdenticonUrl(user));
		}

		//#region If image is not animated, redirect to non static url
		const metadata = await sharp(path).metadata();
		const isAnimated = metadata.pages && metadata.pages > 1;
		if (ctx.query.static && !isAnimated) {
			logger.info(`redirect to non static url`);
			cleanup();
			const url = new URL(ctx.URL);
			url.searchParams.delete('static');
			ctx.status = 301;
			ctx.redirect(url.toString());
			return;
		}
		//#endregion

		ctx.set('Content-Type', 'image/webp');
		ctx.set('Cache-Control', 'max-age=31536000, immutable');

		ctx.body = await sharp(path, {
			pages: 'static' in ctx.query ? 256 : 1,
		})
		.resize(256, 256, {
			fit: 'cover',
			withoutEnlargement: true,
		})
		.rotate()
		.webp({
			quality: 95,
		})
		.toBuffer();
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
