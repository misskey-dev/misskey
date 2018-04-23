import * as mongo from 'mongodb';
import Note from '../../../models/note';
import { IRemoteUser } from '../../../models/user';
import { ILike } from '../type';
import create from '../../../services/note/reaction/create';
import { validateReaction } from '../../../models/note-reaction';

export default async (actor: IRemoteUser, activity: ILike) => {
	const id = typeof activity.object == 'string' ? activity.object : activity.object.id;

	// Transform:
	// https://misskey.ex/notes/xxxx to
	// xxxx
	const noteId = new mongo.ObjectID(id.split('/').pop());

	const note = await Note.findOne({ _id: noteId });
	if (note === null) {
		throw new Error();
	}

	let reaction = 'pudding';

	// 他のMisskeyインスタンスからのリアクション
	if (activity._misskey_reaction) {
		if (validateReaction.ok(activity._misskey_reaction)) {
			reaction = activity._misskey_reaction;
		}
	}

	await create(actor, note, reaction);
};
