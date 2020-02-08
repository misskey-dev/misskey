import Resolver from '../../resolver';
import { IRemoteUser } from '../../../../models/entities/user';
import { createNote, fetchNote } from '../../models/note';
import { getApId, IObject, ICreate } from '../../type';
import { getApLock } from '../../../../misc/app-lock';

/**
 * 投稿作成アクティビティを捌きます
 */
export default async function(resolver: Resolver, actor: IRemoteUser, note: IObject, silent = false, activity?: ICreate): Promise<void> {
	const uri = getApId(note);

	const unlock = await getApLock(uri);

	try {
		const exist = await fetchNote(note);
		if (exist == null) {
			await createNote(note, resolver, silent);
		}
	} finally {
		unlock();
	}
}
