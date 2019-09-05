import { IRemoteUser } from '../../../../models/entities/user';
import { IObject, IUpdate } from '../../type';
import { apLogger } from '../../logger';
import { updateQuestion } from '../../models/question';

/**
 * Updateアクティビティを捌きます
 */
export default async (actor: IRemoteUser, activity: IUpdate): Promise<void> => {
	if ('actor' in activity && actor.uri !== activity.actor) {
		throw new Error('invalid actor');
	}

	apLogger.debug('Update');

	const object = activity.object as IObject;

	switch (object.type) {
		case 'Question':
			apLogger.debug('Question');
			await updateQuestion(object).catch(e => console.log(e));
			break;

		default:
			apLogger.warn(`Unknown type: ${object.type}`);
			break;
	}
};
