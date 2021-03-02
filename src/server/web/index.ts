/**
 * Web Client Server
 */

import * as os from 'os';
import * as fs from 'fs';
import ms = require('ms');
import * as Koa from 'koa';
import * as Router from '@koa/router';
import * as send from 'koa-send';
import * as favicon from 'koa-favicon';
import * as views from 'koa-views';
import * as glob from 'glob';
import * as MarkdownIt from 'markdown-it';

import packFeed from './feed';
import { fetchMeta } from '../../misc/fetch-meta';
import { genOpenapiSpec } from '../api/openapi/gen-spec';
import config from '../../config';
import { Users, Notes, Emojis, UserProfiles, Pages, Channels, Clips } from '../../models';
import parseAcct from '../../misc/acct/parse';
import { getNoteSummary } from '../../misc/get-note-summary';
import { getConnection } from 'typeorm';
import redis from '../../db/redis';
import locales = require('../../../locales');

const markdown = MarkdownIt({
	html: true
});

const client = `${__dirname}/../../client/`;

// Init app
const app = new Koa();

// Init renderer
app.use(views(__dirname + '/views', {
	extension: 'pug',
	options: {
		version: config.version,
		config
	}
}));

// Serve favicon
app.use(favicon(`${__dirname}/../../../assets/favicon.png`));

// Common request handler
app.use(async (ctx, next) => {
	// IFrameの中に入れられないようにする
	ctx.set('X-Frame-Options', 'DENY');
	await next();
});

// Init router
const router = new Router();

//#region static assets

router.get('/assets/(.*)', async ctx => {
	await send(ctx as any, ctx.path, {
		root: client,
		maxage: ms('7 days'),
	});
});

// Apple touch icon
router.get('/apple-touch-icon.png', async ctx => {
	await send(ctx as any, '/assets/apple-touch-icon.png', {
		root: client
	});
});

// ServiceWorker
router.get('/sw.js', async ctx => {
	await send(ctx as any, `/assets/sw.${config.version}.js`, {
		root: client
	});
});

// Manifest
router.get('/manifest.json', require('./manifest'));

router.get('/robots.txt', async ctx => {
	await send(ctx as any, '/assets/robots.txt', {
		root: client
	});
});

//#endregion

// Docs
router.get('/api-doc', async ctx => {
	await send(ctx as any, '/assets/redoc.html', {
		root: client
	});
});

// URL preview endpoint
router.get('/url', require('./url-preview'));

router.get('/api.json', async ctx => {
	ctx.body = genOpenapiSpec();
});

router.get('/docs.json', async ctx => {
	const lang = ctx.query.lang;
	if (!Object.keys(locales).includes(lang)) {
		ctx.body = [];
		return;
	}
	const paths = glob.sync(__dirname + `/../../../src/docs/${lang}/*.md`);
	const docs: { path: string; title: string; }[] = [];
	for (const path of paths) {
		const md = fs.readFileSync(path, { encoding: 'utf8' });
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

		docs.push({
			path: path.split('/').pop()!.split('.')[0],
			title: markdown.renderer.render(headingTokens, {}, {})
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
router.get('/notes/:note', async ctx => {
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

	ctx.status = 404;
});

// Page
router.get('/@:user/pages/:page', async ctx => {
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

	ctx.status = 404;
});

// Clip
// TODO: 非publicなclipのハンドリング
router.get('/clips/:clip', async ctx => {
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

	ctx.status = 404;
});

// Channel
router.get('/channels/:channel', async ctx => {
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

	ctx.status = 404;
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
		redis: redis.server_info.redis_version,
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
