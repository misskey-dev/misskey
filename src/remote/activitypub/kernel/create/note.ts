import Resolver from '../../resolver';
import { IRemoteUser } from '../../../../models/user';
import { createNote, fetchNote } from '../../models/note';

/**
 * 投稿作成アクティビティを捌きます
 */
export default async function(resolver: Resolver, actor: IRemoteUser, note, silent = false): Promise<void> {
	const exist = await fetchNote(note);
	if (exist == null) {
		await createNote(note);
	}
}
