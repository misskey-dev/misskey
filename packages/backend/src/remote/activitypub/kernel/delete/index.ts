import deleteNote from './note';
import deleteClip from './clip';
import { IRemoteUser } from '@/models/entities/user';
import { IDelete, getApId, isTombstone, IObject, validPost, validActor, isOrderedCollection } from '../../type';
import { toSingle } from '@/prelude/array';
import { deleteActor } from './actor';
import { fetchClip } from '@/remote/activitypub/models/clip';

/**
 * 削除アクティビティを捌きます
 */
export default async (actor: IRemoteUser, activity: IDelete): Promise<string> => {
	if ('actor' in activity && actor.uri !== activity.actor) {
		throw new Error('invalid actor');
	}

	// 削除対象objectのtype
	let formarType: string | undefined;

	if (typeof activity.object === 'string') {
		// typeが不明だけど、どうせ消えてるのでremote resolveしない
		formarType = undefined;
	} else {
		const object = activity.object as IObject;
		if (isTombstone(object)) {
			formarType = toSingle(object.formerType);
		} else {
			formarType = toSingle(object.type);
		}
	}

	const uri = getApId(activity.object);

	// type不明でもactorとobjectが同じならばそれはPersonに違いない
	if (!formarType && actor.uri === uri) {
		formarType = 'Person';
	}

	// それでもなかったらおそらくNote
	if (!formarType) {
		formarType = 'Note';
	}

	if (validPost.includes(formarType)) {
		return await deleteNote(actor, uri);
	} else if (validActor.includes(formarType)) {
		return await deleteActor(actor, uri);
	} else {
		const clip = await fetchClip(activity.object);
		if (clip) {
			return await deleteClip(actor, uri);
		}
		return `Unknown type ${formarType}`;
	}
};
