import { IRemoteUser } from '../../../../models/entities/user';
import { getApType, IUpdate, isActor } from '../../type';
import { apLogger } from '../../logger';
import { updateQuestion } from '../../models/question';
import Resolver from '../../resolver';
import { updatePerson } from '../../models/person';

/**
 * Updateアクティビティを捌きます
 */
export default async (actor: IRemoteUser, activity: IUpdate): Promise<string> => {
	if ('actor' in activity && actor.uri !== activity.actor) {
		return `skip: invalid actor`;
	}

	apLogger.debug('Update');

	const resolver = new Resolver();

	const object = await resolver.resolve(activity.object).catch(e => {
		apLogger.error(`Resolution failed: ${e}`);
		throw e;
	});

	if (isActor(object)) {
		await updatePerson(actor.uri!, resolver, object);
		return `ok: Person updated`;
	} else if (getApType(object) === 'Question') {
		await updateQuestion(object).catch(e => console.log(e));
		return `ok: Question updated`;
	} else {
		return `skip: Unknown type: ${getApType(object)}`;
	}
};
