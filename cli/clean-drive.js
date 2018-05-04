const chalk = require('chalk');
const log = require('single-line-log').stdout;
const sequential = require('promise-sequential');
const { default: DriveFile, deleteDriveFile } = require('../built/models/drive-file');
const { default: Note } = require('../built/models/note');
const { default: MessagingMessage } = require('../built/models/messaging-message');
const { default: User } = require('../built/models/user');

async function main() {
	const promiseGens = [];

	const count = await DriveFile.count({});

	let prev;

	for (let i = 0; i < count; i++) {
		promiseGens.push(() => {
			const promise = new Promise(async (res, rej) => {
				const file = await DriveFile.findOne(prev ? {
					_id: { $gt: prev._id }
				} : {}, {
					sort: {
						_id: 1
					}
				});

				prev = file;

				if (file == null) return res();

				log(chalk`scanning: {bold ${file._id}} ...`);

				const attachingUsersCount = await User.count({
					$or: [{
						avatarId: file._id
					}, {
						bannerId: file._id
					}]
				}, { limit: 1 });
				if (attachingUsersCount !== 0) return res();

				const attachingNotesCount = await Note.count({
					mediaIds: file._id
				}, { limit: 1 });
				if (attachingNotesCount !== 0) return res();

				const attachingMessagesCount = await MessagingMessage.count({
					fileId: file._id
				}, { limit: 1 });
				if (attachingMessagesCount !== 0) return res();

				deleteDriveFile(file).then(res).catch(rej);
			});

			promise.then(x => {
				if (prev) {
					if (x == null) {
						log(chalk`{green skipped: {bold ${prev._id}}}`);
					} else {
						log(chalk`{red deleted: {bold ${prev._id}}}`);
					}
				}
				log.clear();
				console.log();
			});

			return promise;
		});
	}

	return await sequential(promiseGens);
}

main().then().catch(console.error);
