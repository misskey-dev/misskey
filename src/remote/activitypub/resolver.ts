import { IObject } from "./type";

const request = require('request-promise-native');

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
		if (typeof value !== 'string') {
			return value;
		}

		if (this.history.has(value)) {
			throw new Error('cannot resolve already resolved one');
		}

		this.history.add(value);

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
			throw new Error('invalid response');
		}

		return object;
	}
}
