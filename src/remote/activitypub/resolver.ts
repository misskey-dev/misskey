import config from '@/config';
import { getJson } from '@/misc/fetch';
import { ILocalUser } from '../../models/entities/user';
import { getInstanceActor } from '../../services/instance-actor';
import { signedGet } from './request';
import { IObject, isCollectionOrOrderedCollection, ICollection, IOrderedCollection } from './type';
import mrfs from '@/config/mrf';

export default class Resolver {
	private history: Set<string>;
	private user?: ILocalUser;

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
			throw new Error(`unrecognized collection type: ${collection.type}`);
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

		if (config.signToActivityPubGet && !this.user) {
			this.user = await getInstanceActor();
		}

		const object = this.user
			? await signedGet(value, this.user)
			: await getJson(value, 'application/activity+json, application/ld+json');

		if (object == null || (
			Array.isArray(object['@context']) ?
				!object['@context'].includes('https://www.w3.org/ns/activitystreams') :
				object['@context'] !== 'https://www.w3.org/ns/activitystreams'
		)) {
			throw new Error('invalid response');
		}

		for (const mrf of mrfs) {
			const res = mrf({activity: object});
			if (res === false) throw new Error('Rejected by MRF');
		}

		return object;
	}
}
