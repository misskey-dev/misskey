import { IRemoteUser } from '../../../models/entities/user';
import { ILike, getApId } from '../type';
import create from '../../../services/note/reaction/create';
import { fetchNote } from '../models/note';

export default async (actor: IRemoteUser, activity: ILike) => {
	const targetUri = getApId(activity.object);

	const note = await fetchNote(targetUri);
	if (!note) return `skip: target note not found ${targetUri}`;

	if (actor.id === note.userId) return `skip: cannot react to my note`;

	await create(actor, note, activity._misskey_reaction || activity.content || activity.name);
	return `ok`;
};
