/**
 * Web Client Server
 */

import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PathOrFileDescriptor, readFileSync } from 'node:fs';
import ms from 'ms';
import Koa from 'koa';
import Router from '@koa/router';
import send from 'koa-send';
import favicon from 'koa-favicon';
import views from 'koa-views';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter.js';
import { KoaAdapter } from '@bull-board/koa';

import { In, IsNull } from 'typeorm';
import { fetchMeta } from '@/misc/fetch-meta.js';
import config from '@/config/index.js';
import { Users, Notes, UserProfiles, Pages, Channels, Clips, GalleryPosts } from '@/models/index.js';
import * as Acct from '@/misc/acct.js';
import { getNoteSummary } from '@/misc/get-note-summary.js';
import { queues } from '@/queue/queues.js';
import { genOpenapiSpec } from '../api/openapi/gen-spec.js';
import { urlPreviewHandler } from './url-preview.js';
import { manifestHandler } from './manifest.js';
import packFeed from './feed.js';

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);

const staticAssets = `${_dirname}/../../../assets/`;
const clientAssets = `${_dirname}/../../../../client/assets/`;
const assets = `${_dirname}/../../../../../built/_client_dist_/`;
const swAssets = `${_dirname}/../../../../../built/_sw_dist_/`;

// Init app
const app = new Koa();

//#region Bull Dashboard
const bullBoardPath = '/queue';

// Authenticate
app.use(async (ctx, next) => {
	if (ctx.path === bullBoardPath || ctx.path.startsWith(bullBoardPath + '/')) {
		const token = ctx.cookies.get('token');
		if (token == null) {
			ctx.status = 401;
			return;
		}
		const user = await Users.findOneBy({ token });
		if (user == null || !(user.isAdmin || user.isModerator)) {
			ctx.status = 403;
			return;
		}
	}
	await next();
});

const serverAdapter = new KoaAdapter();

createBullBoard({
	queues: queues.map(q => new BullAdapter(q)),
	serverAdapter,
});

serverAdapter.setBasePath(bullBoardPath);
app.use(serverAdapter.registerPlugin());
//#endregion

// Init renderer
app.use(views(_dirname + '/views', {
	extension: 'pug',
	options: {
		version: config.version,
		getClientEntry: () => process.env.NODE_ENV === 'production' ?
			config.clientEntry :
			JSON.parse(readFileSync(`${_dirname}/../../../../../built/_client_dist_/manifest.json`, 'utf-8'))['src/init.ts'],
		config,
	},
}));

// Serve favicon
app.use(favicon(`${_dirname}/../../../assets/favicon.ico`));

// Common request handler
app.use(async (ctx, next) => {
	// IFrameの中に入れられないようにする
	ctx.set('X-Frame-Options', 'DENY');
	await next();
});

// Init router
const router = new Router();

//#region static assets

router.get('/static-assets/(.*)', async ctx => {
	await send(ctx as any, ctx.path.replace('/static-assets/', ''), {
		root: staticAssets,
		maxage: ms('7 days'),
	});
});

router.get('/client-assets/(.*)', async ctx => {
	await send(ctx as any, ctx.path.replace('/client-assets/', ''), {
		root: clientAssets,
		maxage: ms('7 days'),
	});
});

router.get('/assets/(.*)', async ctx => {
	await send(ctx as any, ctx.path.replace('/assets/', ''), {
		root: assets,
		maxage: ms('7 days'),
	});
});

// Apple touch icon
router.get('/apple-touch-icon.png', async ctx => {
	await send(ctx as any, '/apple-touch-icon.png', {
		root: staticAssets,
	});
});

router.get('/twemoji/(.*)', async ctx => {
	const path = ctx.path.replace('/twemoji/', '');

	if (!path.match(/^[0-9a-f-]+\.svg$/)) {
		ctx.status = 404;
		return;
	}

	ctx.set('Content-Security-Policy', 'default-src \'none\'; style-src \'unsafe-inline\'');

	await send(ctx as any, path, {
		root: `${_dirname}/../../../node_modules/@discordapp/twemoji/dist/svg/`,
		maxage: ms('30 days'),
	});
});

// ServiceWorker
router.get(`/sw.js`, async ctx => {
	await send(ctx as any, `/sw.js`, {
		root: swAssets,
		maxage: ms('10 minutes'),
	});
});

// Manifest
router.get('/manifest.json', manifestHandler);

router.get('/robots.txt', async ctx => {
	await send(ctx as any, '/robots.txt', {
		root: staticAssets,
	});
});

//#endregion

// Docs
router.get('/api-doc', async ctx => {
	await send(ctx as any, '/redoc.html', {
		root: staticAssets,
	});
});

// URL preview endpoint
router.get('/url', urlPreviewHandler);

router.get('/api.json', async ctx => {
	ctx.body = genOpenapiSpec();
});

const getFeed = async (acct: string) => {
	const { username, host } = Acct.parse(acct);
	const user = await Users.findOneBy({
		usernameLower: username.toLowerCase(),
		host: host ?? IsNull(),
		isSuspended: false,
	});

	return user && await packFeed(user);
};

// Atom
router.get('/@:user.atom', async ctx => {
	const feed = await getFeed(ctx.params.user);

	if (feed) {
		ctx.set('Content-Type', 'application/atom+xml; charset=utf-8');
		ctx.body = feed.atom1();
	} else {
		ctx.status = 404;
	}
});

// RSS
router.get('/@:user.rss', async ctx => {
	const feed = await getFeed(ctx.params.user);

	if (feed) {
		ctx.set('Content-Type', 'application/rss+xml; charset=utf-8');
		ctx.body = feed.rss2();
	} else {
		ctx.status = 404;
	}
});

// JSON
router.get('/@:user.json', async ctx => {
	const feed = await getFeed(ctx.params.user);

	if (feed) {
		ctx.set('Content-Type', 'application/json; charset=utf-8');
		ctx.body = feed.json1();
	} else {
		ctx.status = 404;
	}
});

//#region SSR (for crawlers)
// User
router.get(['/@:user', '/@:user/:sub'], async (ctx, next) => {
	const { username, host } = Acct.parse(ctx.params.user);
	const user = await Users.findOneBy({
		usernameLower: username.toLowerCase(),
		host: host ?? IsNull(),
		isSuspended: false,
	});

	if (user != null) {
		const profile = await UserProfiles.findOneByOrFail({ userId: user.id });
		const meta = await fetchMeta();
		const me = profile.fields
			? profile.fields
				.filter(filed => filed.value != null && filed.value.match(/^https?:/))
				.map(field => field.value)
			: [];

		await ctx.render('user', {
			user, profile, me,
			avatarUrl: await Users.getAvatarUrl(user),
			sub: ctx.params.sub,
			instanceName: meta.name || 'Misskey',
			icon: meta.iconUrl,
			themeColor: meta.themeColor,
		});
		ctx.set('Cache-Control', 'public, max-age=15');
	} else {
		// リモートユーザーなので
		// モデレータがAPI経由で参照可能にするために404にはしない
		await next();
	}
});

router.get('/users/:user', async ctx => {
	const user = await Users.findOneBy({
		id: ctx.params.user,
		host: IsNull(),
		isSuspended: false,
	});

	if (user == null) {
		ctx.status = 404;
		return;
	}

	ctx.redirect(`/@${user.username}${ user.host == null ? '' : '@' + user.host}`);
});

// Note
router.get('/notes/:note', async (ctx, next) => {
	const note = await Notes.findOneBy({
		id: ctx.params.note,
		visibility: In(['public', 'home']),
	});

	if (note) {
		const _note = await Notes.pack(note);
		const profile = await UserProfiles.findOneByOrFail({ userId: note.userId });
		const meta = await fetchMeta();
		await ctx.render('note', {
			note: _note,
			profile,
			avatarUrl: await Users.getAvatarUrl(await Users.findOneByOrFail({ id: note.userId })),
			// TODO: Let locale changeable by instance setting
			summary: getNoteSummary(_note),
			instanceName: meta.name || 'Misskey',
			icon: meta.iconUrl,
			themeColor: meta.themeColor,
		});

		ctx.set('Cache-Control', 'public, max-age=15');

		return;
	}

	await next();
});

// Page
router.get('/@:user/pages/:page', async (ctx, next) => {
	const { username, host } = Acct.parse(ctx.params.user);
	const user = await Users.findOneBy({
		usernameLower: username.toLowerCase(),
		host: host ?? IsNull(),
	});

	if (user == null) return;

	const page = await Pages.findOneBy({
		name: ctx.params.page,
		userId: user.id,
	});

	if (page) {
		const _page = await Pages.pack(page);
		const profile = await UserProfiles.findOneByOrFail({ userId: page.userId });
		const meta = await fetchMeta();
		await ctx.render('page', {
			page: _page,
			profile,
			avatarUrl: await Users.getAvatarUrl(await Users.findOneByOrFail({ id: page.userId })),
			instanceName: meta.name || 'Misskey',
			icon: meta.iconUrl,
			themeColor: meta.themeColor,
		});

		if (['public'].includes(page.visibility)) {
			ctx.set('Cache-Control', 'public, max-age=15');
		} else {
			ctx.set('Cache-Control', 'private, max-age=0, must-revalidate');
		}

		return;
	}

	await next();
});

// Clip
// TODO: 非publicなclipのハンドリング
router.get('/clips/:clip', async (ctx, next) => {
	const clip = await Clips.findOneBy({
		id: ctx.params.clip,
	});

	if (clip) {
		const _clip = await Clips.pack(clip);
		const profile = await UserProfiles.findOneByOrFail({ userId: clip.userId });
		const meta = await fetchMeta();
		await ctx.render('clip', {
			clip: _clip,
			profile,
			avatarUrl: await Users.getAvatarUrl(await Users.findOneByOrFail({ id: clip.userId })),
			instanceName: meta.name || 'Misskey',
			icon: meta.iconUrl,
			themeColor: meta.themeColor,
		});

		ctx.set('Cache-Control', 'public, max-age=15');

		return;
	}

	await next();
});

// Gallery post
router.get('/gallery/:post', async (ctx, next) => {
	const post = await GalleryPosts.findOneBy({ id: ctx.params.post });

	if (post) {
		const _post = await GalleryPosts.pack(post);
		const profile = await UserProfiles.findOneByOrFail({ userId: post.userId });
		const meta = await fetchMeta();
		await ctx.render('gallery-post', {
			post: _post,
			profile,
			avatarUrl: await Users.getAvatarUrl(await Users.findOneByOrFail({ id: post.userId })),
			instanceName: meta.name || 'Misskey',
			icon: meta.iconUrl,
			themeColor: meta.themeColor,
		});

		ctx.set('Cache-Control', 'public, max-age=15');

		return;
	}

	await next();
});

// Channel
router.get('/channels/:channel', async (ctx, next) => {
	const channel = await Channels.findOneBy({
		id: ctx.params.channel,
	});

	if (channel) {
		const _channel = await Channels.pack(channel);
		const meta = await fetchMeta();
		await ctx.render('channel', {
			channel: _channel,
			instanceName: meta.name || 'Misskey',
			icon: meta.iconUrl,
			themeColor: meta.themeColor,
		});

		ctx.set('Cache-Control', 'public, max-age=15');

		return;
	}

	await next();
});
//#endregion

router.get('/_info_card_', async ctx => {
	const meta = await fetchMeta(true);

	ctx.remove('X-Frame-Options');

	await ctx.render('info-card', {
		version: config.version,
		host: config.host,
		meta: meta,
		originalUsersCount: await Users.countBy({ host: IsNull() }),
		originalNotesCount: await Notes.countBy({ userHost: IsNull() }),
	});
});

router.get('/bios', async ctx => {
	await ctx.render('bios', {
		version: config.version,
	});
});

router.get('/cli', async ctx => {
	await ctx.render('cli', {
		version: config.version,
	});
});

const override = (source: string, target: string, depth = 0) =>
	[, ...target.split('/').filter(x => x), ...source.split('/').filter(x => x).splice(depth)].join('/');

router.get('/flush', async ctx => {
	await ctx.render('flush');
});

// streamingに非WebSocketリクエストが来た場合にbase htmlをキャシュ付きで返すと、Proxy等でそのパスがキャッシュされておかしくなる
router.get('/streaming', async ctx => {
	ctx.status = 503;
	ctx.set('Cache-Control', 'private, max-age=0');
});

// Render base html for all requests
router.get('(.*)', async ctx => {
	const meta = await fetchMeta();
	await ctx.render('base', {
		img: meta.bannerUrl,
		title: meta.name || 'Misskey',
		instanceName: meta.name || 'Misskey',
		desc: meta.description,
		icon: meta.iconUrl,
		themeColor: meta.themeColor,
	});
	ctx.set('Cache-Control', 'public, max-age=15');
});

// Register router
app.use(router.routes());

export default app;
