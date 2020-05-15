import * as Router from '@koa/router';
import config from '../config';
import { fetchMeta } from '../misc/fetch-meta';
// import User from '../models/user';
// import Note from '../models/note';

const router = new Router();

const nodeinfo2_1path = '/nodeinfo/2.1';
const nodeinfo2_0path = '/nodeinfo/2.0';

export const links = [/* (awaiting release) {
	rel: 'http://nodeinfo.diaspora.software/ns/schema/2.1',
	href: config.url + nodeinfo2_1path
}, */{
	rel: 'http://nodeinfo.diaspora.software/ns/schema/2.0',
	href: config.url + nodeinfo2_0path
}];

const nodeinfo2 = async () => {
	const [
		meta,
		// total,
		// activeHalfyear,
		// activeMonth,
		// localPosts,
		// localComments
	] = await Promise.all([
		fetchMeta(true),
		// User.count({ host: null }),
		// User.count({ host: null, updatedAt: { $gt: new Date(Date.now() - 15552000000) } }),
		// User.count({ host: null, updatedAt: { $gt: new Date(Date.now() - 2592000000) } }),
		// Note.count({ '_user.host': null, replyId: null }),
		// Note.count({ '_user.host': null, replyId: { $ne: null } })
	]);

	return {
		software: {
			name: 'misskey',
			version: config.version,
			repository: meta.repositoryUrl,
		},
		protocols: ['activitypub'],
		services: {
			inbound: [] as string[],
			outbound: ['atom1.0', 'rss2.0']
		},
		openRegistrations: !meta.disableRegistration,
		usage: {
			users: {} // { total, activeHalfyear, activeMonth },
			// localPosts,
			// localComments
		},
		metadata: {
			nodeName: meta.name,
			nodeDescription: meta.description,
			maintainer: {
				name: meta.maintainerName,
				email: meta.maintainerEmail
			},
			langs: meta.langs,
			tosUrl: meta.ToSUrl,
			repositoryUrl: meta.repositoryUrl,
			feedbackUrl: meta.feedbackUrl,
			disableRegistration: meta.disableRegistration,
			disableLocalTimeline: meta.disableLocalTimeline,
			disableGlobalTimeline: meta.disableGlobalTimeline,
			enableHcaptcha: meta.enableHcaptcha,
			enableRecaptcha: meta.enableRecaptcha,
			maxNoteTextLength: meta.maxNoteTextLength,
			enableTwitterIntegration: meta.enableTwitterIntegration,
			enableGithubIntegration: meta.enableGithubIntegration,
			enableDiscordIntegration: meta.enableDiscordIntegration,
			enableEmail: meta.enableEmail,
			enableServiceWorker: meta.enableServiceWorker
		}
	};
};

router.get(nodeinfo2_1path, async ctx => {
	const base = await nodeinfo2();

	ctx.body = { version: '2.1', ...base };
	ctx.set('Cache-Control', 'public, max-age=600');
});

router.get(nodeinfo2_0path, async ctx => {
	const base = await nodeinfo2();

	delete base.software.repository;

	ctx.body = { version: '2.0', ...base };
	ctx.set('Cache-Control', 'public, max-age=600');
});

export default router;
