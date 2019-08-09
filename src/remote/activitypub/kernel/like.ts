import { IRemoteUser } from '~/models/entities/user';
import { ILike } from '~/remote/activitypub/type';
import create from '~/services/note/reaction/create';
import { Notes } from '~/models';
import { apLogger } from '~/remote/activitypub/logger';

export default async (actor: IRemoteUser, activity: ILike) => {
	const id = typeof activity.object == 'string' ? activity.object : activity.object.id;
	if (id == null) throw new Error('missing id');

	// Transform:
	// https://misskey.ex/notes/xxxx to
	// xxxx
	const noteId = id.split('/').pop();

	const note = await Notes.findOne(noteId);
	if (note == null) {
		apLogger.warn(`Like activity recivied, but no such note: ${id}`, { id });
		return;
	}

	await create(actor, note, activity._misskey_reaction);
};
