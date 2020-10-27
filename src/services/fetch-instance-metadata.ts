import { DOMWindow, JSDOM } from 'jsdom';
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
		const [info, dom, manifest] = await Promise.all([
			fetchNodeinfo(instance).catch(() => null),
			fetchDom(instance).catch(() => null),
			fetchManifest(instance).catch(() => null),
		]);

		const [favicon, icon, themeColor, name, description] = await Promise.all([
			fetchFaviconUrl(instance).catch(() => null),
			fetchIconUrl(instance, dom, manifest).catch(() => null),
			getThemeColor(dom, manifest).catch(() => null),
			getSiteName(info, dom, manifest).catch(() => null),
			getDescription(info, dom, manifest).catch(() => null),
		]);

		logger.succ(`Successfuly fetched metadata of ${instance.host}`);

		const updates = {
			infoUpdatedAt: new Date(),
		} as Record<string, any>;

		if (info) {
			updates.softwareName = info.software?.name.toLowerCase();
			updates.softwareVersion = info.software?.version;
			updates.openRegistrations = info.openRegistrations;
			updates.maintainerName = info.metadata ? info.metadata.maintainer ? (info.metadata.maintainer.name || null) : null : null;
			updates.maintainerEmail = info.metadata ? info.metadata.maintainer ? (info.metadata.maintainer.email || null) : null : null;
		}

		if (name) updates.name = name;
		if (description) updates.description = description;
		if (icon || favicon) updates.iconUrl = icon || favicon;
		if (favicon) updates.faviconUrl = favicon;
		if (themeColor) updates.themeColor = themeColor;

		await Instances.update(instance.id, updates);

		logger.succ(`Successfuly updated metadata of ${instance.host}`);
	} catch (e) {
		logger.error(`Failed to update metadata of ${instance.host}: ${e}`);
	} finally {
		unlock();
	}
}

type NodeInfo = {
	openRegistrations?: any;
	software?: {
		name?: any;
		version?: any;
	};
	metadata?: {
		name?: any;
		nodeName?: any;
		nodeDescription?: any;
		description?: any;
		maintainer?: {
			name?: any;
			email?: any;
		};
	};
};

async function fetchNodeinfo(instance: Instance): Promise<NodeInfo> {
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

async function fetchDom(instance: Instance): Promise<DOMWindow['document']> {
	logger.info(`Fetching HTML of ${instance.host} ...`);

	const url = 'https://' + instance.host;

	const html = await getHtml(url);

	const { window } = new JSDOM(html);
	const doc = window.document;

	return doc;
}

async function fetchManifest(instance: Instance): Promise<Record<string, any> | null> {
	const url = 'https://' + instance.host;

	const manifestUrl = url + '/manifest.json';

	const manifest = await getJson(manifestUrl);

	return manifest;
}

async function fetchFaviconUrl(instance: Instance): Promise<string | null> {
	logger.info(`Fetching favicon URL of ${instance.host} ...`);

	const url = 'https://' + instance.host;
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

async function fetchIconUrl(instance: Instance, doc: DOMWindow['document'] | null, manifest: Record<string, any> | null): Promise<string | null> {
	if (doc) {
		const url = 'https://' + instance.host;

		const hrefAppleTouchIconPrecomposed = doc.querySelector('link[rel="apple-touch-icon-precomposed"]')?.getAttribute('href');
		const hrefAppleTouchIcon = doc.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href');
		const hrefIcon = doc.querySelector('link[rel="icon"]')?.getAttribute('href');

		const href = hrefAppleTouchIconPrecomposed || hrefAppleTouchIcon || hrefIcon;

		if (href) {
			return (new URL(href, url)).href;
		}
	}

	if (manifest && manifest.icons && manifest.icons.length > 0 && manifest.icons[0].src) {
		const url = 'https://' + instance.host;
		return (new URL(manifest.icons[0].src, url)).href;
	}

	return null;
}

async function getThemeColor(doc: DOMWindow['document'] | null, manifest: Record<string, any> | null): Promise<string | null> {
	if (doc) {
		const themeColor = doc.querySelector('meta[name="theme-color"]')?.getAttribute('content');

		if (themeColor) {
			return themeColor;
		}
	}

	if (manifest) {
		return manifest.theme_color;
	}

	return null;
}

async function getSiteName(info: NodeInfo | null, doc: DOMWindow['document'] | null, manifest: Record<string, any> | null): Promise<string | null> {
	if (info && info.metadata) {
		if (info.metadata.nodeName || info.metadata.name) {
			return info.metadata.nodeName || info.metadata.name;
		}
	}

	if (doc) {
		const og = doc.querySelector('meta[property="og:title"]')?.getAttribute('content');

		if (og) {
			return og;
		}
	}

	if (manifest) {
		return manifest?.name || manifest?.short_name;
	}

	return null;
}

async function getDescription(info: NodeInfo | null, doc: DOMWindow['document'] | null, manifest: Record<string, any> | null): Promise<string | null> {
	if (info && info.metadata) {
		if (info.metadata.nodeDescription || info.metadata.description) {
			return info.metadata.nodeDescription || info.metadata.description;
		}
	}

	if (doc) {
		const meta = doc.querySelector('meta[name="description"]')?.getAttribute('content');
		if (meta) {
			return meta;
		}

		const og = doc.querySelector('meta[property="og:description"]')?.getAttribute('content');
		if (og) {
			return og;
		}
	}

	if (manifest) {
		return manifest?.name || manifest?.short_name;
	}

	return null;
}
