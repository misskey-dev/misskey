import { getJson } from '../misc/fetch';
import { Instance } from '../models/entities/instance';
import { Instances } from '../models';
import { getNodeinfoLock } from '../misc/app-lock';
import Logger from '../services/logger';

export const logger = new Logger('nodeinfo', 'cyan');

export async function fetchNodeinfo(instance: Instance) {
	const unlock = await getNodeinfoLock(instance.host);

	const _instance = await Instances.findOne({ host: instance.host });
	const now = Date.now();
	if (_instance && _instance.infoUpdatedAt && (now - _instance.infoUpdatedAt.getTime() < 1000 * 60 * 60 * 24)) {
		unlock();
		return;
	}

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

		await Instances.update(instance.id, {
			infoUpdatedAt: new Date(),
			softwareName: info.software.name.toLowerCase(),
			softwareVersion: info.software.version,
			openRegistrations: info.openRegistrations,
			name: info.metadata ? (info.metadata.nodeName || info.metadata.name || null) : null,
			description: info.metadata ? (info.metadata.nodeDescription || info.metadata.description || null) : null,
			maintainerName: info.metadata ? info.metadata.maintainer ? (info.metadata.maintainer.name || null) : null : null,
			maintainerEmail: info.metadata ? info.metadata.maintainer ? (info.metadata.maintainer.email || null) : null : null,
		});

		logger.succ(`Successfuly fetched nodeinfo of ${instance.host}`);
	} catch (e) {
		logger.error(`Failed to fetch nodeinfo of ${instance.host}: ${e}`);

		await Instances.update(instance.id, {
			infoUpdatedAt: new Date(),
		});
	} finally {
		unlock();
	}
}
