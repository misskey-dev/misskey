/**
 * Web Client Server
 */

import { dirname } from 'path';
import ms from 'ms';
import * as Koa from 'koa';
import * as Router from '@koa/router';
import * as send from 'koa-send';
import * as favicon from 'koa-favicon';
import * as views from 'koa-views';

import packFeed from './feed';
import { fetchMeta } from '@/misc/fetch-meta';
import { genOpenapiSpec } from '../api/openapi/gen-spec';
import config from '@/config/index';
import { Users, Notes, UserProfiles, Pages, Channels, Clips, GalleryPosts } from '@/models/index';
import * as Acct from 'misskey-js/built/acct';
import { getNoteSummary } from '@/misc/get-note-summary';

//const _filename = fileURLToPath(import.meta.url);
const _filename = __filename;
const _dirname = dirname(_filename);

const staticAssets = `${_dirname}/../../../assets/`;
const clientAssets = `${_dirname}/../../../../client/assets/`;
const assets = `${_dirname}/../../../../../built/_client_dist_/`;

// Init app
const app = new Koa();

// Init renderer
app.use(views(_dirname + '/views', {
	extension: 'pug',
	options: {
		version: config.version,
		config
	}
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
		root: staticAssets
	});
});

router.get('/twemoji/(.*)', async ctx => {
	const path = ctx.path.replace('/twemoji/', '');

	if (!path.match(/^[0-9a-f-]+\.svg$/)) {
		ctx.status = 404;
		return;
	}

	ctx.set('Content-Security-Policy', `default-src 'none'; style-src 'unsafe-inline'`);

	await send(ctx as any, path, {
		root: `${_dirname}/../../../node_modules/@discordapp/twemoji/dist/svg/`,
		maxage: ms('30 days'),
	});
});

// ServiceWorker
router.get('/sw.js', async ctx => {
	await send(ctx as any, `/sw.${config.version}.js`, {
		root: assets
	});
});

// Manifest
router.get('/manifest.json', require('./manifest'));

router.get('/robots.txt', async ctx => {
	await send(ctx as any, '/robots.txt', {
		root: staticAssets
	});
});

//#endregion

// Docs
router.get('/api-doc', async ctx => {
	await send(ctx as any, '/redoc.html', {
		root: staticAssets
	});
});

// URL preview endpoint
router.get('/url', require('./url-preview'));

router.get('/api.json', async ctx => {
	ctx.body = genOpenapiSpec();
});

const getFeed = async (acct: string) => {
	const { username, host } = Acct.parse(acct);
	const user = await Users.findOne({
		usernameLower: username.toLowerCase(),
		host,
		isSuspended: false
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
	const user = await Users.findOne({
		usernameLower: username.toLowerCase(),
		host,
		isSuspended: false
	});

	if (user != null) {
		const profile = await UserProfiles.findOneOrFail(user.id);
		const meta = await fetchMeta();
		const me = profile.fields
			? profile.fields
				.filter(filed => filed.value != null && filed.value.match(/^https?:/))
				.map(field => field.value)
			: [];

		await ctx.render('user', {
			user, profile, me,
			sub: ctx.params.sub,
			instanceName: meta.name || 'Misskey',
			icon: meta.iconUrl
		});
		ctx.set('Cache-Control', 'public, max-age=30');
	} else {
		// リモートユーザーなので
		// モデレータがAPI経由で参照可能にするために404にはしない
		await next();
	}
});

router.get('/users/:user', async ctx => {
	const user = await Users.findOne({
		id: ctx.params.user,
		host: null,
		isSuspended: false
	});

	if (user == null) {
		ctx.status = 404;
		return;
	}

	ctx.redirect(`/@${user.username}${ user.host == null ? '' : '@' + user.host}`);
});

// Note
router.get('/notes/:note', async (ctx, next) => {
	const note = await Notes.findOne(ctx.params.note);

	if (note) {
		const _note = await Notes.pack(note);
		const profile = await UserProfiles.findOneOrFail(note.userId);
		const meta = await fetchMeta();
		await ctx.render('note', {
			note: _note,
			profile,
			// TODO: Let locale changeable by instance setting
			summary: getNoteSummary(_note),
			instanceName: meta.name || 'Misskey',
			icon: meta.iconUrl
		});

		if (['public', 'home'].includes(note.visibility)) {
			ctx.set('Cache-Control', 'public, max-age=180');
		} else {
			ctx.set('Cache-Control', 'private, max-age=0, must-revalidate');
		}

		return;
	}

	await next();
});

// Page
router.get('/@:user/pages/:page', async (ctx, next) => {
	const { username, host } = Acct.parse(ctx.params.user);
	const user = await Users.findOne({
		usernameLower: username.toLowerCase(),
		host
	});

	if (user == null) return;

	const page = await Pages.findOne({
		name: ctx.params.page,
		userId: user.id
	});

	if (page) {
		const _page = await Pages.pack(page);
		const profile = await UserProfiles.findOneOrFail(page.userId);
		const meta = await fetchMeta();
		await ctx.render('page', {
			page: _page,
			profile,
			instanceName: meta.name || 'Misskey'
		});

		if (['public'].includes(page.visibility)) {
			ctx.set('Cache-Control', 'public, max-age=180');
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
	const clip = await Clips.findOne({
		id: ctx.params.clip,
	});

	if (clip) {
		const _clip = await Clips.pack(clip);
		const profile = await UserProfiles.findOneOrFail(clip.userId);
		const meta = await fetchMeta();
		await ctx.render('clip', {
			clip: _clip,
			profile,
			instanceName: meta.name || 'Misskey'
		});

		ctx.set('Cache-Control', 'public, max-age=180');

		return;
	}

	await next();
});

// Gallery post
router.get('/gallery/:post', async (ctx, next) => {
	const post = await GalleryPosts.findOne(ctx.params.post);

	if (post) {
		const _post = await GalleryPosts.pack(post);
		const profile = await UserProfiles.findOneOrFail(post.userId);
		const meta = await fetchMeta();
		await ctx.render('gallery-post', {
			post: _post,
			profile,
			instanceName: meta.name || 'Misskey',
			icon: meta.iconUrl
		});

		ctx.set('Cache-Control', 'public, max-age=180');

		return;
	}

	await next();
});

// Channel
router.get('/channels/:channel', async (ctx, next) => {
	const channel = await Channels.findOne({
		id: ctx.params.channel,
	});

	if (channel) {
		const _channel = await Channels.pack(channel);
		const meta = await fetchMeta();
		await ctx.render('channel', {
			channel: _channel,
			instanceName: meta.name || 'Misskey'
		});

		ctx.set('Cache-Control', 'public, max-age=180');

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
		originalUsersCount: await Users.count({ host: null }),
		originalNotesCount: await Notes.count({ userHost: null })
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

const override = (source: string, target: string, depth: number = 0) =>
	[, ...target.split('/').filter(x => x), ...source.split('/').filter(x => x).splice(depth)].join('/');

router.get('/othello', async ctx => ctx.redirect(override(ctx.URL.pathname, 'games/reversi', 1)));
router.get('/reversi', async ctx => ctx.redirect(override(ctx.URL.pathname, 'games')));

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
		icon: meta.iconUrl
	});
	ctx.set('Cache-Control', 'public, max-age=300');
});

// Register router
app.use(router.routes());

module.exports = app;
