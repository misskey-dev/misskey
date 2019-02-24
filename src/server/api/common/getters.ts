import * as mongo from 'mongodb';
import Note from '../../../models/note';
import User, { isRemoteUser, isLocalUser } from '../../../models/user';
import { IdentifiableError } from '../../../misc/identifiable-error';

/**
 * Get note for API processing
 */
export async function getNote(noteId: mongo.ObjectID) {
	const note = await Note.findOne({
		_id: noteId,
		deletedAt: { $exists: false }
	});

	if (note === null) {
		throw new IdentifiableError('9725d0ce-ba28-4dde-95a7-2cbb2c15de24', 'No such note.');
	}

	return note;
}

/**
 * Get user for API processing
 */
export async function getUser(userId: mongo.ObjectID) {
	const user = await User.findOne({
		_id: userId,
		$or: [{
			isDeleted: { $exists: false }
		}, {
			isDeleted: false
		}]
	}, {
		fields: {
			data: false,
			profile: false,
			clientSettings: false
		}
	});

	if (user === null) {
		throw new IdentifiableError('15348ddd-432d-49c2-8a5a-8069753becff', 'No such user.');
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
