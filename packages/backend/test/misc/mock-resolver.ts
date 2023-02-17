import Resolver from '../../src/activitypub/resolver.js';
import { IObject } from '../../src/activitypub/type.js';

type MockResponse = {
	type: string;
	content: string;
};

export class MockResolver extends Resolver {
	private _rs = new Map<string, MockResponse>();
	public async _register(uri: string, content: string | Record<string, any>, type = 'application/activity+json') {
		this._rs.set(uri, {
			type,
			content: typeof content === 'string' ? content : JSON.stringify(content),
		});
	}

	@bindThis
	public async resolve(value: string | IObject): Promise<IObject> {
		if (typeof value !== 'string') return value;

		const r = this._rs.get(value);

		if (!r) {
			throw {
				name: 'StatusError',
				statusCode: 404,
				message: 'Not registed for mock',
			};
		}

		const object = JSON.parse(r.content);

		return object;
	}
}
