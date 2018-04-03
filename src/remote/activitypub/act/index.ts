import create from './create';
import follow from './follow';
import undo from './undo';
import createObject from '../create';

export default (resolver, actor, value, distribute?: boolean) => {
	return resolver.resolve(value).then(resolved => Promise.all(resolved.map(async promisedResult => {
		const result = await promisedResult;
		const created = await (await createObject(result.resolver, actor, [result.object], distribute))[0];

		if (created !== null) {
			return created;
		}

		switch (result.object.type) {
		case 'Create':
			return create(result.resolver, actor, result.object, distribute);

		case 'Follow':
			return follow(result.resolver, actor, result.object, distribute);

		case 'Undo':
			return undo(result.resolver, actor, result.object);

		default:
			return null;
		}
	})));
};
