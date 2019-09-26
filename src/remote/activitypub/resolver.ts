import * as request from 'request-promise-native';
import { IObject, isCollectionOrOrderedCollection, ICollection, IOrderedCollection } from './type';
import config from '../../config';

export default class Resolver {
	private history: Set<string>;
	private timeout = 10 * 1000;

	constructor() {
		this.history = new Set();
	}

	public getHistory(): string[] {
		return Array.from(this.history);
	}

	public async resolveCollection(value: string | IObject): Promise<ICollection | IOrderedCollection> {
		const collection = typeof value === 'string'
			? await this.resolve(value)
			: value;

		if (isCollectionOrOrderedCollection(collection)) {
			return collection;
		} else {
			throw new Error(`unknown collection type: ${collection.type}`);
		}
	}

	public async resolve(value: string | IObject): Promise<IObject> {
		if (value == null) {
			throw new Error('resolvee is null (or undefined)');
		}

		if (typeof value !== 'string') {
			return value;
		}

		if (this.history.has(value)) {
			throw new Error('cannot resolve already resolved one');
		}

		this.history.add(value);

		const object = await request({
			url: value,
			proxy: config.proxy,
			timeout: this.timeout,
			forever: true,
			headers: {
				'User-Agent': config.userAgent,
				Accept: 'application/activity+json, application/ld+json'
			},
			json: true
		});

		if (object == null || (
			Array.isArray(object['@context']) ?
				!object['@context'].includes('https://www.w3.org/ns/activitystreams') :
				object['@context'] !== 'https://www.w3.org/ns/activitystreams'
		)) {
			throw new Error('invalid response');
		}

		return object;
	}
}
