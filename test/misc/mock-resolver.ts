import Resolver from '../../src/remote/activitypub/resolver';
import { IObject } from '../../src/remote/activitypub/type';

type MockResponse = {
	type: string;
	content: string;
};

export class MockResolver extends Resolver {
	private _rs = new Map<string, MockResponse>();
	public async _register(uri: string, content: string | Record<string, any>, type = 'application/activity+json') {
		this._rs.set(uri, {
			type,
			content: typeof content === 'string' ? content : JSON.stringify(content)
		});
	}

	public async resolve(value: string | IObject): Promise<IObject> {
		if (typeof value !== 'string') return value;

		const r = this._rs.get(value);

		if (!r) {
			throw {
				name: `StatusError`,
				statusCode: 404,
				message: `Not registed for mock`
			};
		}

		const object = JSON.parse(r.content);

		return object;
	}
}
