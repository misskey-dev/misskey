import act from '../../act';
import unfollow from './unfollow';
import Resolver from '../../resolver';

export default async (resolver: Resolver, actor, activity) => {
	if ('actor' in activity && actor.account.uri !== activity.actor) {
		throw new Error();
	}

	const results = await act(resolver, actor, activity.object);

	await Promise.all(results.map(async promisedResult => {
		const result = await promisedResult;

		if (result === null) {
			return;
		}

		switch (result.object.$ref) {
		case 'following':
			await unfollow(result.object);
		}
	}));

	return null;
};
