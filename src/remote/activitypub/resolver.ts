import * as request from 'request-promise-native';
import { IObject } from './type';
import config from '../../config';
import { apLogger } from './logger';

export const logger = apLogger.createSubLogger('resolver');

export default class Resolver {
	private history: Set<string>;
	private timeout = 10 * 1000;

	constructor() {
		this.history = new Set();
	}

	public async resolveCollection(value: any) {
		const collection = typeof value === 'string'
			? await this.resolve(value)
			: value;

		switch (collection.type) {
			case 'Collection': {
				collection.objects = collection.items;
				break;
			}

			case 'OrderedCollection': {
				collection.objects = collection.orderedItems;
				break;
			}

			default: {
				logger.error(`unknown collection type: ${collection.type}`);
				throw new Error(`unknown collection type: ${collection.type}`);
			}
		}

		return collection;
	}

	public async resolve(value: any): Promise<IObject> {
		if (value == null) {
			logger.error('resolvee is null (or undefined)');
			throw new Error('resolvee is null (or undefined)');
		}

		if (typeof value !== 'string') {
			return value;
		}

		if (this.history.has(value)) {
			logger.error(`cannot resolve already resolved one: ${value}`);
			throw new Error('cannot resolve already resolved one');
		}

		this.history.add(value);

		const object = await request({
			url: value,
			proxy: config.proxy,
			timeout: this.timeout,
			headers: {
				'User-Agent': config.userAgent,
				Accept: 'application/activity+json, application/ld+json'
			},
			json: true
		}).catch(e => {
			logger.error(`request error: ${value}: ${e.message}`, {
				url: value,
				e: e
			});
			throw new Error(`request error: ${e.message}`);
		});

		if (object === null || (
			Array.isArray(object['@context']) ?
				!object['@context'].includes('https://www.w3.org/ns/activitystreams') :
				object['@context'] !== 'https://www.w3.org/ns/activitystreams'
		)) {
			logger.error(`invalid response: ${value}`, {
				url: value,
				object: object
			});
			throw new Error('invalid response');
		}

		return object;
	}
}
