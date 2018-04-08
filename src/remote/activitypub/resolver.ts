import * as request from 'request-promise-native';
import * as debug from 'debug';
import { IObject } from './type';
//import config from '../../config';

const log = debug('misskey:activitypub:resolver');

export default class Resolver {
	private history: Set<string>;

	constructor() {
		this.history = new Set();
	}

	public async resolveCollection(value) {
		const collection = typeof value === 'string'
			? await this.resolve(value)
			: value;

		switch (collection.type) {
		case 'Collection':
			collection.objects = collection.object.items;
			break;

		case 'OrderedCollection':
			collection.objects = collection.object.orderedItems;
			break;

		default:
			throw new Error(`unknown collection type: ${collection.type}`);
		}

		return collection;
	}

	public async resolve(value): Promise<IObject> {
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

		//#region resolve local objects
		// TODO
		//if (value.startsWith(`${config.url}/`)) {
		//#endregion

		const object = await request({
			url: value,
			headers: {
				Accept: 'application/activity+json, application/ld+json'
			},
			json: true
		});

		if (object === null || (
			Array.isArray(object['@context']) ?
				!object['@context'].includes('https://www.w3.org/ns/activitystreams') :
				object['@context'] !== 'https://www.w3.org/ns/activitystreams'
		)) {
			log(`invalid response: ${JSON.stringify(object, null, 2)}`);
			throw new Error('invalid response');
		}

		log(`resolved: ${JSON.stringify(object, null, 2)}`);

		return object;
	}
}
