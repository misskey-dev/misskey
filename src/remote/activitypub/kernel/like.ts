import * as mongo from 'mongodb';
import Note from '../../../models/note';
import { IRemoteUser } from '../../../models/user';
import { ILike } from '../type';
import create from '../../../services/note/reaction/create';
import { getFallbackReaction } from '../../../misc/reaction-lib';

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

	const reaction = activity._misskey_reaction ? activity._misskey_reaction : await getFallbackReaction();

	await create(actor, note, reaction);
};
