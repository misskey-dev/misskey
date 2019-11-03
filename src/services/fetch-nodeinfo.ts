import * as request from 'request-promise-native';
import { Instance } from '../models/entities/instance';
import { Instances } from '../models';
import config from '../config';
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
		const info = await request({
			url: 'https://' + instance.host + '/nodeinfo/2.0',
			proxy: config.proxy,
			timeout: 1000 * 10,
			forever: true,
			headers: {
				'User-Agent': config.userAgent,
				Accept: 'application/json'
			},
			json: true
		});

		await Instances.update(instance.id, {
			infoUpdatedAt: new Date(),
			softwareName: info.software.name,
			softwareVersion: info.software.version,
			openRegistrations: info.openRegistrations,
			metadata: info.metadata,
			name: info.metadata ? (info.metadata.name || null) : null,
			description: info.metadata ? (info.metadata.description || null) : null,
			maintainerName: info.metadata ? info.metadata.maintainer ? (info.metadata.maintainer.name || null) : null : null,
			maintainerEmail: info.metadata ? info.metadata.maintainer ? (info.metadata.maintainer.email || null) : null : null,
		});

		logger.succ(`Successfuly fetched nodeinfo of ${instance.host}`);
	} catch (e) {
		logger.error(`Failed to fetch nodeinfo of ${instance.host}: ${e}`);
	} finally {
		unlock();
	}
}
