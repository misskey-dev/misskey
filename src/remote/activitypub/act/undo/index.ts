import act from '../../act';
import unfollow from './unfollow';

export default async (resolver, actor, activity) => {
	if ('actor' in activity && actor.account.uri !== activity.actor) {
		throw new Error();
	}

	const results = await act(resolver, actor, activity.object);

	await Promise.all(results.map(async result => {
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
