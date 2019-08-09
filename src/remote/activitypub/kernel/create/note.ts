import Resolver from '~/remote/activitypub/resolver';
import { IRemoteUser } from '~/models/entities/user';
import { createNote, fetchNote } from '~/remote/activitypub/models/note';

/**
 * 投稿作成アクティビティを捌きます
 */
export default async function(resolver: Resolver, actor: IRemoteUser, note: any, silent = false): Promise<void> {
	const exist = await fetchNote(note);
	if (exist == null) {
		await createNote(note);
	}
}
