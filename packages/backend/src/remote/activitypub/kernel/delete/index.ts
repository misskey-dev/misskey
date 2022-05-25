import deleteNote from './note.js';
import { CacheableRemoteUser } from '@/models/entities/user.js';
import { IDelete, getApId, isTombstone, IObject, validPost, validActor } from '../../type.js';
import { toSingle } from '@/prelude/array.js';
import { deleteActor } from './actor.js';

/**
 * 削除アクティビティを捌きます
 */
export default async (actor: CacheableRemoteUser, activity: IDelete): Promise<string> => {
	if ('actor' in activity && actor.uri !== activity.actor) {
		throw new Error('invalid actor');
	}

	// 削除対象objectのtype
	let formerType: string | undefined;

	if (typeof activity.object === 'string') {
		// typeが不明だけど、どうせ消えてるのでremote resolveしない
		formerType = undefined;
	} else {
		const object = activity.object as IObject;
		if (isTombstone(object)) {
			formerType = toSingle(object.formerType);
		} else {
			formerType = toSingle(object.type);
		}
	}

	const uri = getApId(activity.object);

	// type不明でもactorとobjectが同じならばそれはPersonに違いない
	if (!formerType && actor.uri === uri) {
		formerType = 'Person';
	}

	// それでもなかったらおそらくNote
	if (!formerType) {
		formerType = 'Note';
	}

	if (validPost.includes(formerType)) {
		return await deleteNote(actor, uri);
	} else if (validActor.includes(formerType)) {
		return await deleteActor(actor, uri);
	} else {
		return `Unknown type ${formerType}`;
	}
};
