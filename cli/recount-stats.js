const { default: Note } = require('../built/models/note');
const { default: Meta } = require('../built/models/meta');
const { default: User } = require('../built/models/user');

async function main() {
	const meta = await Meta.findOne({});

	const notesCount = await Note.count();

	const usersCount = await User.count();

	const originalNotesCount = await Note.count({
		'_user.host': null
	});

	const originalUsersCount = await User.count({
		host: null
	});

	const stats = {
		notesCount,
		usersCount,
		originalNotesCount,
		originalUsersCount
	};

	if (meta) {
		await Meta.update({}, {
			$set: {
				stats
			}
		});
	} else {
		await Meta.insert({
			stats
		});
	}
}

main().then(() => {
	console.log('done');
}).catch(console.error);
