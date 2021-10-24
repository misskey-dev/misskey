/**
 * Web Client Server
 */

import * as os from 'os';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as ms from 'ms';
import * as Koa from 'koa';
import * as Router from '@koa/router';
import * as send from 'koa-send';
import * as favicon from 'koa-favicon';
import * as views from 'koa-views';
import * as glob from 'glob';
import * as MarkdownIt from 'markdown-it';

import packFeed from './feed';
import { fetchMeta } from '@/misc/fetch-meta';
import { genOpenapiSpec } from '../api/openapi/gen-spec';
import config from '@/config/index';
import { Users, Notes, Emojis, UserProfiles, Pages, Channels, Clips, GalleryPosts } from '@/models/index';
import { parseAcct } from '@/misc/acct';
import { getNoteSummary } from '@/misc/get-note-summary';
import { getConnection } from 'typeorm';
import { redisClient } from '../../db/redis';
import * as locales from '../../../locales/index';

//const _filename = fileURLToPath(import.meta.url);
const _filename = __filename;
const _dirname = dirname(_filename);

const markdown = MarkdownIt({
	html: true
});

const changelog = fs.readFileSync(`${_dirname}/../../../CHANGELOG.md`, { encoding: 'utf8' });
function genDoc(path: string): string {
	let md = fs.readFileSync(path, { encoding: 'utf8' });
	md = md.replace('<!--[CHANGELOG]-->', changelog);
	return md;
}

const staticAssets = `${_dirname}/../../../assets/`;
const docAssets = `${_dirname}/../../../src/docs/`;
const assets = `${_dirname}/../../assets/`;

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

router.get('/doc-assets/(.*)', async ctx => {
	if (ctx.path.includes('..')) return;
	const path = `${_dirname}/../../../src/docs/${ctx.path.replace('/doc-assets/', '')}`;
	const doc = genDoc(path);
	ctx.set('Content-Type', 'text/plain; charset=utf-8');
	ctx.body = doc;
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

router.get('/docs.json', async ctx => {
	const lang = ctx.query.lang;
	const query = ctx.query.q;
	if (!Object.keys(locales).includes(lang)) {
		ctx.body = [];
		return;
	}
	const dirPath = `${_dirname}/../../../src/docs/${lang}`.replace(/\\/g, '/');
	const paths = glob.sync(`${dirPath}/**/*.md`);
	const docs: { path: string; title: string; summary: string; }[] = [];
	for (const path of paths) {
		const md = genDoc(path);

		if (query && query.length > 0) {
			// TODO: カタカナをひらがなにして比較するなどしたい
			if (!md.includes(query)) continue;
		}

		const parsed = markdown.parse(md, {});
		if (parsed.length === 0) return;

		const buf = [...parsed];
		const headingTokens = [];

		// もっとも上にある見出しを抽出する
		while (buf[0].type !== 'heading_open') {
			buf.shift();
		}
		buf.shift();
		while (buf[0].type as string !== 'heading_close') {
			const token = buf.shift();
			if (token) {
				headingTokens.push(token);
			}
		}

		const firstParagrapfTokens = [];
		while (buf[0].type !== 'paragraph_open') {
			buf.shift();
		}
		buf.shift();
		while (buf[0].type as string !== 'paragraph_close') {
			const token = buf.shift();
			if (token) {
				firstParagrapfTokens.push(token);
			}
		}

		docs.push({
			path: path.match(new RegExp(`docs\/${lang}\/(.+?)\.md$`))![1],
			title: markdown.renderer.render(headingTokens, {}, {}),
			summary: markdown.renderer.render(firstParagrapfTokens, {}, {}),
		});
	}

	ctx.body = docs;
});

const getFeed = async (acct: string) => {
	const { username, host } = parseAcct(acct);
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
	const { username, host } = parseAcct(ctx.params.user);
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
			summary: getNoteSummary(_note, locales['ja-JP']),
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
	const { username, host } = parseAcct(ctx.params.user);
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

router.get('/info', async ctx => {
	const meta = await fetchMeta(true);
	const emojis = await Emojis.find({
		where: { host: null }
	});

	const proxyAccount = meta.proxyAccountId ? await Users.pack(meta.proxyAccountId).catch(() => null) : null;

	await ctx.render('info', {
		version: config.version,
		machine: os.hostname(),
		os: os.platform(),
		node: process.version,
		psql: await getConnection().query('SHOW server_version').then(x => x[0].server_version),
		redis: redisClient.server_info.redis_version,
		cpu: {
			model: os.cpus()[0].model,
			cores: os.cpus().length
		},
		emojis: emojis,
		meta: meta,
		proxyAccountName: proxyAccount ? proxyAccount.username : null,
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
