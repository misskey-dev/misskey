import RemoteUserObject from '../../../models/remote-user-object';
import { IObject } from './type';
const request = require('request-promise-native');

type IResult = {
  resolver: Resolver;
  object: IObject;
};

async function resolveUnrequestedOne(this: Resolver, value) {
	if (typeof value !== 'string') {
		return { resolver: this, object: value };
	}

	const resolver = new Resolver(this.requesting);

	resolver.requesting.add(value);

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
		throw new Error();
	}

	return { resolver, object };
}

async function resolveCollection(this: Resolver, value) {
	if (Array.isArray(value)) {
		return value;
	}

	const resolved = typeof value === 'string' ?
		await resolveUnrequestedOne.call(this, value) :
		value;

	switch (resolved.type) {
	case 'Collection':
		return resolved.items;

	case 'OrderedCollection':
		return resolved.orderedItems;

	default:
		return [resolved];
	}
}

export default class Resolver {
	private requesting: Set<string>;

	constructor(iterable?: Iterable<string>) {
		this.requesting = new Set(iterable);
	}

	public async resolve(value): Promise<Array<Promise<IResult>>> {
		const collection = await resolveCollection.call(this, value);

		return collection
			.filter(element => !this.requesting.has(element))
			.map(resolveUnrequestedOne.bind(this));
	}

	public resolveOne(value) {
		if (this.requesting.has(value)) {
			throw new Error();
		}

		return resolveUnrequestedOne.call(this, value);
	}

	public async resolveRemoteUserObjects(value) {
		const collection = await resolveCollection.call(this, value);

		return collection.filter(element => !this.requesting.has(element)).map(element => {
			if (typeof element === 'string') {
				const object = RemoteUserObject.findOne({ uri: element });

				if (object !== null) {
					return object;
				}
			}

			return resolveUnrequestedOne.call(this, element);
		});
	}
}
