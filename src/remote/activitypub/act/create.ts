import create from '../create';
import Resolver from '../resolver';

export default (resolver: Resolver, actor, activity, distribute) => {
	if ('actor' in activity && actor.account.uri !== activity.actor) {
		throw new Error();
	}

	return create(resolver, actor, activity.object, distribute);
};
