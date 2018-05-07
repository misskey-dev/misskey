import Note from '../../../models/note';
import User from '../../../models/user';

/**
 * Get the misskey's statistics
 */
module.exports = params => new Promise(async (res, rej) => {
	const notesCount = await Note.count();

	const usersCount = await User.count();

	const originalNotesCount = await Note.count({
		'_user.host': null
	});

	const originalUsersCount = await User.count({
		host: null
	});

	res({
		notesCount,
		usersCount,
		originalNotesCount,
		originalUsersCount
	});
});
