import Router from '@koa/router';
import config from '@/config/index.js';
import { fetchMeta } from '@/misc/fetch-meta.js';
import { Users, Notes } from '@/models/index.js';
import { IsNull, MoreThan } from 'typeorm';
import { MAX_NOTE_TEXT_LENGTH } from '@/const.js';
import { Cache } from '@/misc/cache.js';

const router = new Router();

const nodeinfo2_1path = '/nodeinfo/2.1';
const nodeinfo2_0path = '/nodeinfo/2.0';

export const links = [/* (awaiting release) {
	rel: 'http://nodeinfo.diaspora.software/ns/schema/2.1',
	href: config.url + nodeinfo2_1path
}, */{
	rel: 'http://nodeinfo.diaspora.software/ns/schema/2.0',
	href: config.url + nodeinfo2_0path,
}];

const nodeinfo2 = async () => {
	const now = Date.now();
	const [
		meta,
		total,
		activeHalfyear,
		activeMonth,
		localPosts,
	] = await Promise.all([
		fetchMeta(true),
		Users.count({ where: { host: IsNull() } }),
		Users.count({ where: { host: IsNull(), lastActiveDate: MoreThan(new Date(now - 15552000000)) } }),
		Users.count({ where: { host: IsNull(), lastActiveDate: MoreThan(new Date(now - 2592000000)) } }),
		Notes.count({ where: { userHost: IsNull() } }),
	]);

	const proxyAccount = meta.proxyAccountId ? await Users.pack(meta.proxyAccountId).catch(() => null) : null;

	return {
		software: {
			name: 'misskey',
			version: config.version,
			repository: meta.repositoryUrl,
		},
		protocols: ['activitypub'],
		services: {
			inbound: [] as string[],
			outbound: ['atom1.0', 'rss2.0'],
		},
		openRegistrations: !meta.disableRegistration,
		usage: {
			users: { total, activeHalfyear, activeMonth },
			localPosts,
			localComments: 0,
		},
		metadata: {
			nodeName: meta.name,
			nodeDescription: meta.description,
			maintainer: {
				name: meta.maintainerName,
				email: meta.maintainerEmail,
			},
			langs: meta.langs,
			tosUrl: meta.ToSUrl,
			repositoryUrl: meta.repositoryUrl,
			feedbackUrl: meta.feedbackUrl,
			disableRegistration: meta.disableRegistration,
			disableLocalTimeline: meta.disableLocalTimeline,
			disableGlobalTimeline: meta.disableGlobalTimeline,
			emailRequiredForSignup: meta.emailRequiredForSignup,
			enableHcaptcha: meta.enableHcaptcha,
			enableRecaptcha: meta.enableRecaptcha,
			maxNoteTextLength: MAX_NOTE_TEXT_LENGTH,
			enableTwitterIntegration: meta.enableTwitterIntegration,
			enableGithubIntegration: meta.enableGithubIntegration,
			enableDiscordIntegration: meta.enableDiscordIntegration,
			enableEmail: meta.enableEmail,
			enableServiceWorker: meta.enableServiceWorker,
			proxyAccountName: proxyAccount ? proxyAccount.username : null,
		},
	};
};

const cache = new Cache<Awaited<ReturnType<typeof nodeinfo2>>>(1000 * 60 * 10);

router.get(nodeinfo2_1path, async ctx => {
	const base = await cache.fetch(null, () => nodeinfo2());

	ctx.body = { version: '2.1', ...base };
	ctx.set('Cache-Control', 'public, max-age=600');
});

router.get(nodeinfo2_0path, async ctx => {
	const base = await cache.fetch(null, () => nodeinfo2());

	delete base.software.repository;

	ctx.body = { version: '2.0', ...base };
	ctx.set('Cache-Control', 'public, max-age=600');
});

export default router;
