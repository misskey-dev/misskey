import { IRemoteUser } from '~/models/entities/user';
import { IUpdate, IObject } from '~/remote/activitypub/type';
import { apLogger } from '~/remote/activitypub/logger';
import { updateQuestion } from '~/remote/activitypub/models/question';

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
