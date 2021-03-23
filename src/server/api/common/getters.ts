import { IdentifiableError } from '@/misc/identifiable-error';
import { User } from '../../../models/entities/user';
import { Note } from '../../../models/entities/note';
import { Notes, Users } from '../../../models';

/**
 * Get note for API processing
 */
export async function getNote(noteId: Note['id']) {
	const note = await Notes.findOne(noteId);

	if (note == null) {
		throw new IdentifiableError('9725d0ce-ba28-4dde-95a7-2cbb2c15de24', 'No such note.');
	}

	return note;
}

/**
 * Get user for API processing
 */
export async function getUser(userId: User['id']) {
	const user = await Users.findOne(userId);

	if (user == null) {
		throw new IdentifiableError('15348ddd-432d-49c2-8a5a-8069753becff', 'No such user.');
	}

	return user;
}

/**
 * Get remote user for API processing
 */
export async function getRemoteUser(userId: User['id']) {
	const user = await getUser(userId);

	if (!Users.isRemoteUser(user)) {
		throw new Error('user is not a remote user');
	}

	return user;
}

/**
 * Get local user for API processing
 */
export async function getLocalUser(userId: User['id']) {
	const user = await getUser(userId);

	if (!Users.isLocalUser(user)) {
		throw new Error('user is not a local user');
	}

	return user;
}
