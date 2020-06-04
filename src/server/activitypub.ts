import * as Router from '@koa/router';
import * as httpSignature from 'http-signature';

import { renderActivity } from '../remote/activitypub/renderer';
import renderNote from '../remote/activitypub/renderer/note';
import renderKey from '../remote/activitypub/renderer/key';
import { renderPerson } from '../remote/activitypub/renderer/person';
import renderEmoji from '../remote/activitypub/renderer/emoji';
import Outbox, { packActivity } from './activitypub/outbox';
import Followers from './activitypub/followers';
import Following from './activitypub/following';
import Featured from './activitypub/featured';
import { inbox as processInbox } from '../queue';
import { isSelfHost } from '../misc/convert-host';
import { Notes, Users, Emojis, UserKeypairs, NoteReactions } from '../models';
import { ILocalUser, User } from '../models/entities/user';
import { In } from 'typeorm';
import { ensure } from '../prelude/ensure';
import { renderLike } from '../remote/activitypub/renderer/like';

// Init router
const router = new Router();

//#region Routing

function inbox(ctx: Router.RouterContext) {
	let signature;

	try {
		signature = httpSignature.parseRequest(ctx.req, { 'headers': [] });
	} catch (e) {
		ctx.status = 401;
		return;
	}

	processInbox(ctx.request.body, signature);

	ctx.status = 202;
}

const ACTIVITY_JSON = 'application/activity+json; charset=utf-8';
const LD_JSON = 'application/ld+json; profile="https://www.w3.org/ns/activitystreams"; charset=utf-8';

function isActivityPubReq(ctx: Router.RouterContext) {
	ctx.response.vary('Accept');
	const accepted = ctx.accepts('html', ACTIVITY_JSON, LD_JSON);
	return typeof accepted === 'string' && !accepted.match(/html/);
}

export function setResponseType(ctx: Router.RouterContext) {
	const accept = ctx.accepts(ACTIVITY_JSON, LD_JSON);
	if (accept === LD_JSON) {
		ctx.response.type = LD_JSON;
	} else {
		ctx.response.type = ACTIVITY_JSON;
	}
}

// inbox
router.post('/inbox', inbox);
router.post('/users/:user/inbox', inbox);

// note
router.get('/notes/:note', async (ctx, next) => {
	if (!isActivityPubReq(ctx)) return await next();

	const note = await Notes.findOne({
		id: ctx.params.note,
		visibility: In(['public', 'home']),
		localOnly: false
	});

	if (note == null) {
		ctx.status = 404;
		return;
	}

	// リモートだったらリダイレクト
	if (note.userHost != null) {
		if (note.uri == null || isSelfHost(note.userHost)) {
			ctx.status = 500;
			return;
		}
		ctx.redirect(note.uri);
		return;
	}

	ctx.body = renderActivity(await renderNote(note, false));
	ctx.set('Cache-Control', 'public, max-age=180');
	setResponseType(ctx);
});

// note activity
router.get('/notes/:note/activity', async ctx => {
	const note = await Notes.findOne({
		id: ctx.params.note,
		userHost: null,
		visibility: In(['public', 'home']),
		localOnly: false
	});

	if (note == null) {
		ctx.status = 404;
		return;
	}

	ctx.body = renderActivity(await packActivity(note));
	ctx.set('Cache-Control', 'public, max-age=180');
	setResponseType(ctx);
});

// outbox
router.get('/users/:user/outbox', Outbox);

// followers
router.get('/users/:user/followers', Followers);

// following
router.get('/users/:user/following', Following);

// featured
router.get('/users/:user/collections/featured', Featured);

// publickey
router.get('/users/:user/publickey', async ctx => {
	const userId = ctx.params.user;

	const user = await Users.findOne({
		id: userId,
		host: null
	});

	if (user == null) {
		ctx.status = 404;
		return;
	}

	const keypair = await UserKeypairs.findOne(user.id).then(ensure);

	if (Users.isLocalUser(user)) {
		ctx.body = renderActivity(renderKey(user, keypair));
		ctx.set('Cache-Control', 'public, max-age=180');
		setResponseType(ctx);
	} else {
		ctx.status = 400;
	}
});

// user
async function userInfo(ctx: Router.RouterContext, user: User | undefined) {
	if (user == null) {
		ctx.status = 404;
		return;
	}

	ctx.body = renderActivity(await renderPerson(user as ILocalUser));
	ctx.set('Cache-Control', 'public, max-age=180');
	setResponseType(ctx);
}

router.get('/users/:user', async (ctx, next) => {
	if (!isActivityPubReq(ctx)) return await next();

	const userId = ctx.params.user;

	const user = await Users.findOne({
		id: userId,
		host: null,
		isSuspended: false
	});

	await userInfo(ctx, user);
});

router.get('/@:user', async (ctx, next) => {
	if (!isActivityPubReq(ctx)) return await next();

	const user = await Users.findOne({
		usernameLower: ctx.params.user.toLowerCase(),
		host: null,
		isSuspended: false
	});

	await userInfo(ctx, user);
});
//#endregion

// emoji
router.get('/emojis/:emoji', async ctx => {
	const emoji = await Emojis.findOne({
		host: null,
		name: ctx.params.emoji
	});

	if (emoji == null) {
		ctx.status = 404;
		return;
	}

	ctx.body = renderActivity(await renderEmoji(emoji));
	ctx.set('Cache-Control', 'public, max-age=180');
	setResponseType(ctx);
});

// like
router.get('/likes/:like', async ctx => {
	const reaction = await NoteReactions.findOne(ctx.params.like);

	if (reaction == null) {
		ctx.status = 404;
		return;
	}

	const note = await Notes.findOne(reaction.noteId);

	if (note == null) {
		ctx.status = 404;
		return;
	}

	ctx.body = renderActivity(await renderLike(reaction, note));
	ctx.set('Cache-Control', 'public, max-age=180');
	setResponseType(ctx);
});

export default router;
