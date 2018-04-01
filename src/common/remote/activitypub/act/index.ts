import create from './create';
import createObject from '../create';
import Resolver from '../resolver';

export default (actor, value) => {
	return new Resolver().resolve(value).then(resolved => Promise.all(resolved.map(async asyncResult => {
		const { resolver, object } = await asyncResult;
		const created = await (await createObject(resolver, actor, [object]))[0];

		if (created !== null) {
			return created;
		}

		switch (object.type) {
		case 'Create':
			return create(resolver, actor, object);

		default:
			return null;
		}
	})));
};
