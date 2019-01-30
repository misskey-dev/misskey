import * as Router from 'koa-router';
import User from '../../../models/user';
import { toASCII } from 'punycode';
import config from '../../../config';
import { ObjectID } from 'bson';
import Emoji from '../../../models/emoji';
import { toMastodonEmojis } from './emoji';
import fetchMeta from '../../../misc/fetch-meta';
import * as pkg from '../../../../package.json';

// Init router
const router = new Router();

router.get('/v1/custom_emojis', async ctx => ctx.body =
	(await Emoji.find({ host: null }, {
		fields: {
			_id: false
		}
	})).map(x => toMastodonEmojis(x)));

router.get('/v1/instance', async ctx => { // TODO: This is a temporary implementation. Consider creating helper methods!
	const meta = await fetchMeta();
	const { originalNotesCount, originalUsersCount } = meta.stats;
	const domains = await User.distinct('host', { host: { $ne: null } }) as any as [] || [];
	const maintainer = await User.findOne({ isAdmin: true }) || {
		_id: ObjectID.createFromTime(0),
		username: '', // TODO: Consider making this better!
		host: config.host,
		name: '',
		isLocked: false,
		isBot: false,
		createdAt: new Date(0),
		description: '',
		avatarUrl: '',
		bannerUrl: '',
		followersCount: 0,
		followingCount: 0,
		notesCount: 0
	};
	const acct = maintainer.host ? `${maintainer.username}@${maintainer.host}` : maintainer.username;
	const emojis = (await Emoji.find({ host: null }, {
		fields: {
			_id: false
		}
	})).map(toMastodonEmojis);

	ctx.body = {
		uri: config.hostname,
		title: meta.name || 'Misskey',
		description: meta.description || '',
		email: meta.maintainer.email,
		version: `0.0.0 (compatible; Misskey ${pkg.version})`, // TODO: commit hash
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
		languages: meta.langs || [ 'ja' ],
		contact_account: {
			id: maintainer._id,
			username: maintainer.username,
			acct: acct,
			display_name: maintainer.name || '',
			locked: maintainer.isLocked,
			bot: maintainer.isBot,
			created_at: maintainer.createdAt,
			note: maintainer.description,
			url: `${config.url}/@${acct}`,
			avatar: maintainer.avatarUrl || '',
			/*
			avatar_static: maintainer.avatarUrl || '', // TODO: Implement static avatar url (ensure non-animated GIF)
			*/
			header: maintainer.bannerUrl || '',
			/*
			header_static: maintainer.bannerUrl || '', // TODO: Implement static header url (ensure non-animated GIF)
			*/
			followers_count: maintainer.followersCount,
			following_count: maintainer.followingCount,
			statuses_count: maintainer.notesCount,
			emojis: emojis,
			moved: null,
			fields: null
		}
	};
});

router.get('/v1/instance/peers', async ctx => {
	const peers = await User.distinct('host', { host: { $ne: null } }) as any as string[];
	const punyCodes = peers.map(peer => toASCII(peer));
	ctx.body = punyCodes;
});

module.exports = router;
