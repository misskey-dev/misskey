import { IRemoteUser } from '../../../models/entities/user';
import { ILike } from '../type';
import create from '../../../services/note/reaction/create';
import { Notes } from '../../../models';

export default async (actor: IRemoteUser, activity: ILike) => {
	const id = typeof activity.object == 'string' ? activity.object : activity.object.id;
	if (id == null) throw 'missing id';

	// Transform:
	// https://misskey.ex/notes/xxxx to
	// xxxx
	const noteId = id.split('/').pop();

	const note = await Notes.findOne(noteId);
	if (note == null) {
		throw new Error();
	}

	await create(actor, note, activity._misskey_reaction);
};
