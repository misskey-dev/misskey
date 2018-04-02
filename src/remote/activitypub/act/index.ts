import create from './create';
import createObject from '../create';
import Resolver from '../resolver';

export default (actor, value, distribute) => {
	return new Resolver().resolve(value).then(resolved => Promise.all(resolved.map(async promisedResult => {
		const { resolver, object } = await promisedResult;
		const created = await (await createObject(resolver, actor, [object], distribute))[0];

		if (created !== null) {
			return created;
		}

		switch (object.type) {
		case 'Create':
			return create(resolver, actor, object, distribute);

		default:
			return null;
		}
	})));
};
