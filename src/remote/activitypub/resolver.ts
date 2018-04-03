const request = require('request-promise-native');

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

	public async resolveCollection(value) {
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

	public resolveOne(value) {
		if (this.requesting.has(value)) {
			throw new Error();
		}

		return this.resolveUnrequestedOne(value);
	}
}
