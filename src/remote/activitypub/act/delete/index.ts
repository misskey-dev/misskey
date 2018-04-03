import create from '../../create';
import deletePost from './post';

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

		switch (result.object.$ref) {
		case 'posts':
			await deletePost(result.object);
		}
	}));

	return null;
};
