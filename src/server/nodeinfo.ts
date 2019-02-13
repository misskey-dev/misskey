import * as Router from 'koa-router';
import config from '../config';
import fetchMeta from '../misc/fetch-meta';
// import User from '../models/user';
import { name as softwareName, version, repository } from '../../package.json';
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
		{ name, description, maintainer, langs, broadcasts, disableRegistration, disableLocalTimeline, disableGlobalTimeline, enableRecaptcha, maxNoteTextLength, enableTwitterIntegration, enableGithubIntegration, enableDiscordIntegration, enableEmail, enableServiceWorker },
		// total,
		// activeHalfyear,
		// activeMonth,
		// localPosts,
		// localComments
	] = await Promise.all([
		fetchMeta(),
		// User.count({ host: null }),
		// User.count({ host: null, updatedAt: { $gt: new Date(Date.now() - 15552000000) } }),
		// User.count({ host: null, updatedAt: { $gt: new Date(Date.now() - 2592000000) } }),
		// Note.count({ '_user.host': null, replyId: null }),
		// Note.count({ '_user.host': null, replyId: { $ne: null } })
	]);

	return {
		software: {
			name: softwareName,
			version,
			repository: repository.url
		},
		protocols: ['activitypub'],
		services: {
			inbound: [] as string[],
			outbound: ['atom1.0', 'rss2.0']
		},
		openRegistrations: !disableRegistration,
		usage: {
			users: {} // { total, activeHalfyear, activeMonth },
			// localPosts,
			// localComments
		},
		metadata: { name, description, maintainer, langs, broadcasts, disableRegistration, disableLocalTimeline, disableGlobalTimeline, enableRecaptcha, maxNoteTextLength, enableTwitterIntegration, enableGithubIntegration, enableDiscordIntegration, enableEmail, enableServiceWorker }
	};
};

router.get(nodeinfo2_1path, async ctx => {
	const base = await nodeinfo2();

	ctx.body = { version: '2.1', ...base };
});

router.get(nodeinfo2_0path, async ctx => {
	const base = await nodeinfo2();

	delete base.software.repository;

	ctx.body = { version: '2.0', ...base };
});

export default router;
