import RemoteUserObject from '../../models/remote-user-object';
import { IObject } from './type';
const request = require('request-promise-native');

type IResult = {
  resolver: Resolver;
  object: IObject;
};

export default class Resolver {
	private requesting: Set<string>;

	constructor(iterable?: Iterable<string>) {
		this.requesting = new Set(iterable);
	}

	private async resolveUnrequestedOne(value) {
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

	private async resolveCollection(value) {
		const resolved = typeof value === 'string' ?
			await this.resolveUnrequestedOne(value) :
			{ resolver: this, object: value };

		switch (resolved.object.type) {
		case 'Collection':
			resolved.object = resolved.object.items;
			break;

		case 'OrderedCollection':
			resolved.object = resolved.object.orderedItems;
			break;

		default:
			if (!Array.isArray(value)) {
				resolved.object = [resolved.object];
			}
			break;
		}

		return resolved;
	}

	public async resolve(value): Promise<Array<Promise<IResult>>> {
		const { resolver, object } = await this.resolveCollection(value);

		return object
			.filter(element => !resolver.requesting.has(element))
			.map(resolver.resolveUnrequestedOne.bind(resolver));
	}

	public resolveOne(value) {
		if (this.requesting.has(value)) {
			throw new Error();
		}

		return this.resolveUnrequestedOne(value);
	}

	public async resolveRemoteUserObjects(value) {
		const { resolver, object } = await this.resolveCollection(value);

		return object.filter(element => !resolver.requesting.has(element)).map(element => {
			if (typeof element === 'string') {
				const object = RemoteUserObject.findOne({ uri: element });

				if (object !== null) {
					return object;
				}
			}

			return resolver.resolveUnrequestedOne(element);
		});
	}
}
