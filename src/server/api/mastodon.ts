import * as Router from 'koa-router';
import User from '../../models/user';
import { toASCII } from 'punycode';
import config from '../../config';
import Meta, { IMeta } from '../../models/meta';
import { ObjectID } from 'bson';
import { toMastodonEmojis } from '../../models/mastodon/emoji';
import { customEmojisPath } from './endpoints/emoji';

// Init router
const router = new Router();

async function getMeta(): Promise<IMeta> {
	return await Meta.findOne() || {};
}

router.get(customEmojisPath, async ctx => {
	const meta = await getMeta();
	if (meta)
		ctx.body = (await Promise.all((meta.emojis || []).map(toMastodonEmojis))).reduce((a, c) => a.concat(c), []);
	else
		ctx.status = 404;
});

router.get('/v1/instance', async ctx => { // TODO: This is a temporary implementation. Consider creating helper methods!
	const meta = await getMeta();
	if (meta) {
		const { originalNotesCount, originalUsersCount } = meta.stats || {
			originalNotesCount: 0,
			originalUsersCount: 0
		};
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

		ctx.body = {
			uri: config.hostname,
			title: config.name || 'Misskey',
			description: config.description || '',
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
				emojis: [],
				moved: null,
				fields: null
			}
		};
	} else
		ctx.status = 404;
});

router.get('/v1/instance/peers', async ctx => {
	const peers = await User.distinct('host', { host: { $ne: null } }) as any as string[];
	const punyCodes = peers.map(peer => toASCII(peer));
	ctx.body = punyCodes;
});

module.exports = router;
