import create from './create';
import performDeleteActivity from './delete';
import follow from './follow';
import undo from './undo';
import createObject from '../create';
import Resolver from '../resolver';

export default async (parentResolver: Resolver, actor, value, distribute?: boolean) => {
	const collection = await parentResolver.resolveCollection(value);

	return collection.object.map(async element => {
		const { resolver, object } = await collection.resolver.resolveOne(element);
		const created = await (await createObject(resolver, actor, [object], distribute))[0];

		if (created !== null) {
			return created;
		}

		switch (object.type) {
		case 'Create':
			return create(resolver, actor, object, distribute);

		case 'Delete':
			return performDeleteActivity(resolver, actor, object);

		case 'Follow':
			return follow(resolver, actor, object, distribute);

		case 'Undo':
			return undo(resolver, actor, object);

		default:
			return null;
		}
	});
};
