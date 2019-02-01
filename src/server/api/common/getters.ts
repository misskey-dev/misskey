import * as mongo from 'mongodb';
import Note from "../../../models/note";
import User, { isRemoteUser, isLocalUser } from "../../../models/user";

/**
 * Get valied note for API processing
 */
export async function getValiedNote(noteId: mongo.ObjectID) {
	const note = await Note.findOne({
		_id: noteId,
		deletedAt: { $exists: false }
	});

	if (note === null) {
		throw 'note not found';
	}

	return note;
}

/**
 * Get user for API processing
 */
export async function getUser(userId: mongo.ObjectID) {
	const user = await User.findOne({
		_id: userId
	});

	if (user == null) {
		throw 'user not found';
	}

	return user;
}

/**
 * Get remote user for API processing
 */
export async function getRemoteUser(userId: mongo.ObjectID) {
	const user = await getUser(userId);

	if (!isRemoteUser(user)) {
		throw 'user is not a remote user';
	}

	return user;
}

/**
 * Get local user for API processing
 */
export async function getLocalUser(userId: mongo.ObjectID) {
	const user = await getUser(userId);

	if (!isLocalUser(user)) {
		throw 'user is not a local user';
	}

	return user;
}
