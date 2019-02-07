import * as Router from 'koa-router';
import config from '../config';
import fetchMeta from '../misc/fetch-meta';
import NodeinfoStats, { INodeinfoStats } from '../models/nodeinfo-stats';
import { name as softwareName, version, repository } from '../../package.json';
import { fetchStats } from '../daemons/nodeinfo-stats';

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

const keys = [
	'name',
	'description',
	'maintainer',
	'langs',
	'broadcasts',
	'disableRegistration',
	'disableLocalTimeline',
	'disableGlobalTimeline',
	'enableRecaptcha',
	'maxNoteTextLength',
	'enableTwitterIntegration',
	'enableGithubIntegration',
	'enableDiscordIntegration',
	'enableEmail',
	'enableServiceWorker'
];

const nodeinfo2 = () => Promise.all([
		fetchMeta().then(x => Object.entries(x).filter(([k, v]) => keys.includes(k)).reduce((a, [k, v]) => (a[k] = v, a), {} as Record<string, any>)),
		NodeinfoStats.count().then(x => x ? NodeinfoStats.findOne() : fetchStats())
	]).then(([metadata, usage]: [any, INodeinfoStats]) => ({
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
		openRegistrations: !metadata.disableRegistration,
		usage,
		metadata
	}));

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
