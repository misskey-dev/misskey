import { JSDOM } from 'jsdom';
import fetch from 'node-fetch';
import { getJson, getHtml, getAgentByUrl } from '../misc/fetch';
import { Instance } from '../models/entities/instance';
import { Instances } from '../models';
import { getFetchInstanceMetadataLock } from '../misc/app-lock';
import Logger from './logger';
import { URL } from 'url';

const logger = new Logger('metadata', 'cyan');

export async function fetchInstanceMetadata(instance: Instance): Promise<void> {
	const unlock = await getFetchInstanceMetadataLock(instance.host);

	const _instance = await Instances.findOne({ host: instance.host });
	const now = Date.now();
	if (_instance && _instance.infoUpdatedAt && (now - _instance.infoUpdatedAt.getTime() < 1000 * 60 * 60 * 24)) {
		unlock();
		return;
	}

	logger.info(`Fetching metadata of ${instance.host} ...`);

	try {
		const [info, icon] = await Promise.all([
			fetchNodeinfo(instance).catch(() => null),
			fetchIconUrl(instance).catch(() => null),
		]);

		logger.succ(`Successfuly fetched metadata of ${instance.host}`);

		const updates = {
			infoUpdatedAt: new Date(),
		} as Record<string, any>;

		if (info) {
			updates.softwareName = info.software.name.toLowerCase();
			updates.softwareVersion = info.software.version;
			updates.openRegistrations = info.openRegistrations;
			updates.name = info.metadata ? (info.metadata.nodeName || info.metadata.name || null) : null;
			updates.description = info.metadata ? (info.metadata.nodeDescription || info.metadata.description || null) : null;
			updates.maintainerName = info.metadata ? info.metadata.maintainer ? (info.metadata.maintainer.name || null) : null : null;
			updates.maintainerEmail = info.metadata ? info.metadata.maintainer ? (info.metadata.maintainer.email || null) : null : null;
		}

		if (icon) {
			updates.iconUrl = icon;
		}

		await Instances.update(instance.id, updates);

		logger.succ(`Successfuly updated metadata of ${instance.host}`);
	} catch (e) {
		logger.error(`Failed to update metadata of ${instance.host}: ${e}`);
	} finally {
		unlock();
	}
}

async function fetchNodeinfo(instance: Instance): Promise<Record<string, any>> {
	logger.info(`Fetching nodeinfo of ${instance.host} ...`);

	try {
		const wellknown = await getJson('https://' + instance.host + '/.well-known/nodeinfo')
			.catch(e => {
				if (e.statusCode === 404) {
					throw 'No nodeinfo provided';
				} else {
					throw e.statusCode || e.message;
				}
			});

		if (wellknown.links == null || !Array.isArray(wellknown.links)) {
			throw 'No wellknown links';
		}

		const links = wellknown.links as any[];

		const lnik1_0 = links.find(link => link.rel === 'http://nodeinfo.diaspora.software/ns/schema/1.0');
		const lnik2_0 = links.find(link => link.rel === 'http://nodeinfo.diaspora.software/ns/schema/2.0');
		const lnik2_1 = links.find(link => link.rel === 'http://nodeinfo.diaspora.software/ns/schema/2.1');
		const link = lnik2_1 || lnik2_0 || lnik1_0;

		if (link == null) {
			throw 'No nodeinfo link provided';
		}

		const info = await getJson(link.href)
			.catch(e => {
				throw e.statusCode || e.message;
			});

		logger.succ(`Successfuly fetched nodeinfo of ${instance.host}`);

		return info;
	} catch (e) {
		logger.error(`Failed to fetch nodeinfo of ${instance.host}: ${e}`);

		throw e;
	}
}

async function fetchIconUrl(instance: Instance): Promise<string | null> {
	logger.info(`Fetching icon URL of ${instance.host} ...`);

	const url = 'https://' + instance.host;

	const html = await getHtml(url);

	const { window } = new JSDOM(html);
	const doc = window.document;

	const hrefAppleTouchIconPrecomposed = doc.querySelector('link[rel="apple-touch-icon-precomposed"]')?.getAttribute('href');
	const hrefAppleTouchIcon = doc.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href');
	const hrefIcon = doc.querySelector('link[rel="icon"]')?.getAttribute('href');

	const href = hrefAppleTouchIconPrecomposed || hrefAppleTouchIcon || hrefIcon;

	if (href) {
		return (new URL(href, url)).href;
	}

	const faviconUrl = url + '/favicon.ico';

	const favicon = await fetch(faviconUrl, {
		timeout: 10000,
		agent: getAgentByUrl,
	});

	if (favicon.ok) {
		return faviconUrl;
	}

	return null;
}
