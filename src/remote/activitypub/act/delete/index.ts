import Resolver from '../../resolver';
import deleteNote from './note';

export default async (actor, activity): Promise<void> => {
	if ('actor' in activity && actor.account.uri !== activity.actor) {
		throw new Error();
	}

	const resolver = new Resolver();

	const object = await resolver.resolve(activity);

	switch (object.type) {
	case 'Note':
		deleteNote(object);
		break;
	}
};
