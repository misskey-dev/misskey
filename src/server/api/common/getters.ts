import * as mongo from 'mongodb';
import Note from '../../../models/note';
import User, { isRemoteUser, isLocalUser } from '../../../models/user';
import { ApiError } from '../error';

/**
 * Get valied note for API processing
 */
export async function getValiedNote(noteId: mongo.ObjectID) {
	const note = await Note.findOne({
		_id: noteId,
		deletedAt: { $exists: false }
	});

	if (note === null) {
		throw new ApiError({
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: '9725d0ce-ba28-4dde-95a7-2cbb2c15de24'
		});
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
		throw new ApiError({
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '15348ddd-432d-49c2-8a5a-8069753becff'
		});
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
