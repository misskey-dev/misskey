import create from '../create';

export default (resolver, actor, activity, distribute) => {
	if ('actor' in activity && actor.account.uri !== activity.actor) {
		throw new Error();
	}

	return create(resolver, actor, activity.object, distribute);
};
