import create from '../create';
import deleteObject from '../delete';

export default async (resolver, actor, activity) => {
	if ('actor' in activity && actor.account.uri !== activity.actor) {
		throw new Error();
	}

	const results = await create(resolver, actor, activity.object);

	await Promise.all(results.map(async promisedResult => {
		const result = await promisedResult;
		if (result === null) {
			return;
		}

		await deleteObject(result);
	}));

	return null;
};
