import * as Router from 'koa-router';
import User from '../../../models/user';
import { toASCII } from 'punycode';
import config from '../../config';
import Meta from '../../models/meta';
import { toMastodonAccount } from '../../models/mastodon/account';
import Note from '../../models/note';
import Reaction from '../../models/note-reaction';
import parse from '../../mfm/parse';
import { TextElementLink } from '../../mfm/parse/elements/link';
import { getSummary } from '../web/url-preview';
import { ObjectID } from 'bson';
import Emoji from '../../../models/emoji';
import { toMastodonEmojis } from './emoji';

// Init router
const router = new Router();

const visible = ['public', 'unlisted'];

// TODO: Implement rate limits
// !WIP: ^~~ DO IT ASAP!

router.get('/v1/accounts/:id', async ctx => {
	const user = await User.findOne({ _id: ctx.params.id });
	if (user)
		ctx.body = await toMastodonAccount(user);
	else
		ctx.status = 404;
});

router.get('/v1/custom_emojis', async ctx => ctx.body =
	(await Emoji.find({ host: null }, {
		fields: {
			_id: false
		}
	})).map(toMastodonEmojis));

router.get('/v1/instance', async ctx => {
	const meta = await Meta.findOne() || {};
	const { originalNotesCount, originalUsersCount } = meta.stats || {
		originalNotesCount: 0,
		originalUsersCount: 0
	};
	const domains = await User.distinct('host', { host: { $ne: null } }) as any as [] || [];
	const maintainer = await User.findOne({ isAdmin: true });

	ctx.body = {
		uri: config.hostname,
		title: meta.name || 'Misskey',
		description: meta.description || '',
		email: config.maintainer.email || config.maintainer.url.startsWith('mailto:') ? config.maintainer.url.slice(7) : '',
		version: `0.0.0 (compatible; ${config.user_agent})`, // TODO: How to tell about that this is an api for compatibility?
		thumbnail: meta.bannerUrl,
		/*
		urls: {
			streaming_api: config.ws_url + '/mastodon' // TODO: Implement compatible streaming API
		}, */
		stats: {
			user_count: originalUsersCount,
			status_count: originalNotesCount,
			domain_count: domains.length
		},
		languages: config.languages || [ 'ja' ],
		contact_account: maintainer ? toMastodonAccount(maintainer) : {}
	};
});

router.get('/v1/instance/peers', async ctx => {
	const peers = await User.distinct('host', { host: { $ne: null } }) as any as string[];
	const punyCodes = peers.map(peer => toASCII(peer));
	ctx.body = punyCodes;
});

router.get('/v1/statuses/:id', async ctx => {
	const note = await Note.findOne({
		_id: ctx.params.id,
		deletedAt: null,
		visibility: { $in: visible }
	});

	if (note)
		ctx.body = note;
	else
		ctx.status = 404;
});

router.get('/v1/statuses/:id/context', async ctx => {
	const note = await Note.findOne({
		_id: ctx.params.id,
		deletedAt: null,
		visibility: { $in: visible }
	});

	if (note) {
		const inReply = await Note.find({
			_id: note.replyId
		});
		let lastInReply = inReply;
		while (lastInReply && lastInReply.some(x => !!x.replyId))
			inReply.push(...(lastInReply = await Note.find({
				_id: { $in: lastInReply.map(x => x.replyId) }
			})));

		const replies = await Note.find({
			_id: { $in: note._replyIds },
			visibility: { $in: visible }
		});
		let lastReplies = replies;
		while (lastReplies && lastReplies.some(x => x._replyIds && !!x._replyIds.length))
			replies.push(...(lastReplies = await Note.find({
				_id: { $in: lastReplies.map(x => x._replyIds).reduce((a, c) => a.concat(c), []) }
			})));

		ctx.body = {
			ancestors: inReply,
			descendants: replies
		};
	} else
		ctx.status = 404;
});

router.get('/v1/statuses/:id/card', async ctx => {
	const note = await Note.findOne({
		_id: ctx.params.id,
		deletedAt: null,
		visibility: { $in: visible }
	});

	if (note) {
		const link = parse(note.text).find(x => x.type === 'link' && !(x as TextElementLink).silent) as TextElementLink;
		const { url, title, description, thumbnail, player } = await getSummary(link.url);
		const width = player ? player.width : null;
		const height = player ? player.height : null;

		if (link && url) {
			ctx.body = {
				url,
				title,
				description,
				image: thumbnail,
				type: player ? 'video' : 'link', // TODO: Support 'photo' and 'rich'
				author_name: null, // TODO: Return correct value (maybe not always null)
				author_url: null, // TODO: Return correct value (maybe not always null)
				provider_name: null, // TODO: Return correct value (maybe not always null)
				provider_url: null, // TODO: Return correct value (maybe not always null)
				html: player ? `<iframe src=\"${player.url}\"${width ? ` width="${width}"` : ''}${height ? ` height="${height}"` : ''} allowtransparency=\"true\" scrolling=\"no\" frameborder=\"0\"></iframe>` : null,
				width,
				height
			};
			return;
		}
	}
	ctx.status = 404;
});

const rebloggedByPath = '/v1/statuses/:id/reblogged_by';
router.get(rebloggedByPath, async ctx => {
	const limit = ctx.query.limit as number || 40;
	const maxId = ctx.query.max_id as ObjectID;
	const sinceId = ctx.query.since_id as ObjectID;

	const note = await Note.find({
		renoteId: ctx.params.id,
		deletedAt: null,
		visibility: { $in: visible }
	});

	if (note) {
		const rebloggedBy = note.map(x => x.userId).filter((v, i, a) => !(a.indexOf(v) ^ i)).sort();

		const { length } = rebloggedBy;
		const since = maxId ? rebloggedBy.lastIndexOf(maxId) + 1 : 0;
		const max = sinceId ? rebloggedBy.indexOf(sinceId) + 1 : 0;

		const { min } = Math;
		const end = since ? min(since + limit, length) : max;
		const start = max ? -min(max + limit, length) : since;

		const curr = rebloggedBy.slice(start, end);
		const [ head ] = curr;
		const [ tail ] = curr.reverse();

		const next = rebloggedBy.slice(end).length;
		const prev = rebloggedBy.slice(0, start).length;

		ctx.body = curr;
		if (next || prev)
			ctx.set('Link', [
				next ? `<${router.url(rebloggedByPath, ctx.params)}?limit=${limit}&max_id=${tail}>; rel="next"` : null,
				prev ? `<${router.url(rebloggedByPath, ctx.params)}?limit=${limit}&since_id=${head}>; rel="prev"` : null
			].filter(x => x).join(', '));
	} else
		ctx.status = 404;
});

const favouritedByPath = '/v1/statuses/:id/reblogged_by';
router.get(favouritedByPath, async ctx => {
	const limit = ctx.query.limit as number || 40;
	const maxId = ctx.query.max_id as ObjectID;
	const sinceId = ctx.query.since_id as ObjectID;

	const note = await Note.findOne({
		_id: ctx.params.id,
		deletedAt: null,
		visibility: { $in: visible }
	});

	if (note) {
		const reaction = await Reaction.find({
			noteId: ctx.params.id,
			deletedAt: { $exists: false }
		});

		const favouritedBy = reaction.map(x => x.userId).filter((v, i, a) => !(a.indexOf(v) ^ i)).sort();

		const { length } = favouritedBy;
		const since = maxId ? favouritedBy.lastIndexOf(maxId) + 1 : 0;
		const max = sinceId ? favouritedBy.indexOf(sinceId) + 1 : 0;

		const { min } = Math;
		const end = since ? min(since + limit, length) : max;
		const start = max ? -min(max + limit, length) : since;

		const curr = favouritedBy.slice(start, end);
		const [ head ] = curr;
		const [ tail ] = curr.reverse();

		const next = favouritedBy.slice(end).length;
		const prev = favouritedBy.slice(0, start).length;

		ctx.body = curr;
		if (next || prev)
			ctx.set('Link', [
				next ? `<${router.url(favouritedByPath, ctx.params)}?limit=${limit}&max_id=${tail}>; rel="next"` : null,
				prev ? `<${router.url(favouritedByPath, ctx.params)}?limit=${limit}&since_id=${head}>; rel="prev"` : null
			].filter(x => x).join(', '));
	} else
		ctx.status = 404;
});

module.exports = router;
