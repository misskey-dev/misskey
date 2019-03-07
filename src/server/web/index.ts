/**
 * Web Client Server
 */

import * as os from 'os';
import ms = require('ms');
import * as Koa from 'koa';
import * as Router from 'koa-router';
import * as send from 'koa-send';
import * as favicon from 'koa-favicon';
import * as views from 'koa-views';
import { ObjectID } from 'mongodb';

import docs from './docs';
import packFeed from './feed';
import User from '../../models/user';
import parseAcct from '../../misc/acct/parse';
import config from '../../config';
import Note, { pack as packNote } from '../../models/note';
import getNoteSummary from '../../misc/get-note-summary';
import fetchMeta from '../../misc/fetch-meta';
import Emoji from '../../models/emoji';
import * as pkg from '../../../package.json';
import { genOpenapiSpec } from '../api/openapi/gen-spec';

const client = `${__dirname}/../../client/`;

// Init app
const app = new Koa();

// Init renderer
app.use(views(__dirname + '/views', {
	extension: 'pug',
	options: {
		config
	}
}));

// Serve favicon
app.use(favicon(`${client}/assets/favicon.ico`));

// Common request handler
app.use(async (ctx, next) => {
	// IFrameの中に入れられないようにする
	ctx.set('X-Frame-Options', 'DENY');
	await next();
});

// Init router
const router = new Router();

//#region static assets

router.get('/assets/*', async ctx => {
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
router.get(/^\/sw\.(.+?)\.js$/, async ctx => {
	await send(ctx as any, `/assets/sw.${ctx.params[0]}.js`, {
		root: client
	});
});

// Manifest
router.get('/manifest.json', async ctx => {
	await send(ctx as any, '/assets/manifest.json', {
		root: client
	});
});

router.get('/robots.txt', async ctx => {
	await send(ctx as any, '/assets/robots.txt', {
		root: client
	});
});

//#endregion

// Docs
router.use('/docs', docs.routes());
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

const getFeed = async (acct: string) => {
	const { username, host } = parseAcct(acct);
	const user = await User.findOne({
		usernameLower: username.toLowerCase(),
		host
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

//#region for crawlers
// User
router.get('/@:user', async (ctx, next) => {
	const { username, host } = parseAcct(ctx.params.user);
	const user = await User.findOne({
		usernameLower: username.toLowerCase(),
		host
	});

	if (user != null) {
		const meta = await fetchMeta();
		await ctx.render('user', {
			user,
			instanceName: meta.name
		});
		ctx.set('Cache-Control', 'public, max-age=180');
	} else {
		// リモートユーザーなので
		await next();
	}
});

router.get('/users/:user', async ctx => {
	if (!ObjectID.isValid(ctx.params.user)) {
		ctx.status = 404;
		return;
	}

	const userId = new ObjectID(ctx.params.user);

	const user = await User.findOne({
		_id: userId,
		host: null
	});

	if (user === null) {
		ctx.status = 404;
		return;
	}

	ctx.redirect(`/@${user.username}${ user.host == null ? '' : '@' + user.host}`);
});

// Note
router.get('/notes/:note', async ctx => {
	if (ObjectID.isValid(ctx.params.note)) {
		const note = await Note.findOne({ _id: ctx.params.note });

		if (note) {
			const _note = await packNote(note);
			const meta = await fetchMeta();
			await ctx.render('note', {
				note: _note,
				summary: getNoteSummary(_note),
				instanceName: meta.name
			});

			if (['public', 'home'].includes(note.visibility)) {
				ctx.set('Cache-Control', 'public, max-age=180');
			} else {
				ctx.set('Cache-Control', 'private, max-age=0, must-revalidate');
			}

			return;
		}
	}

	ctx.status = 404;
});
//#endregion

router.get('/info', async ctx => {
	const meta = await fetchMeta();
	const emojis = await Emoji.find({ host: null }, {
		fields: {
			_id: false
		}
	});
	await ctx.render('info', {
		version: pkg.version,
		machine: os.hostname(),
		os: os.platform(),
		node: process.version,
		cpu: {
			model: os.cpus()[0].model,
			cores: os.cpus().length
		},
		emojis: emojis,
		meta: meta
	});
});

const override = (source: string, target: string, depth: number = 0) =>
	[, ...target.split('/').filter(x => x), ...source.split('/').filter(x => x).splice(depth)].join('/');

router.get('/othello', async ctx => ctx.redirect(override(ctx.URL.pathname, 'games/reversi', 1)));
router.get('/reversi', async ctx => ctx.redirect(override(ctx.URL.pathname, 'games')));

// Render base html for all requests
router.get('*', async ctx => {
	const meta = await fetchMeta();
	await ctx.render('base', {
		img: meta.bannerUrl
	});
	ctx.set('Cache-Control', 'public, max-age=300');
});

// Register router
app.use(router.routes());

module.exports = app;
