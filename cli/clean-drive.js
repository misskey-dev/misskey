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
				function skip() {
					res([i, file, false]);
				}

				const file = await DriveFile.findOne(prev ? {
					_id: { $lt: prev._id }
				} : {}, {
					sort: {
						_id: -1
					}
				});

				prev = file;

				if (file == null) return skip();

				log(chalk`{gray ${i}} scanning: {bold ${file._id}} ...`);

				const attachingUsersCount = await User.count({
					$or: [{
						avatarId: file._id
					}, {
						bannerId: file._id
					}]
				}, { limit: 1 });
				if (attachingUsersCount !== 0) return skip();

				const attachingNotesCount = await Note.count({
					mediaIds: file._id
				}, { limit: 1 });
				if (attachingNotesCount !== 0) return skip();

				const attachingMessagesCount = await MessagingMessage.count({
					fileId: file._id
				}, { limit: 1 });
				if (attachingMessagesCount !== 0) return skip();

				deleteDriveFile(file).then(() => {
					res([i, file, true]);
				}).catch(rej);
			});

			promise.then(([i, file, deleted]) => {
				if (deleted) {
					log(chalk`{gray ${i}} {red deleted: {bold ${file._id}}}`);
				} else {
					log(chalk`{gray ${i}} {green skipped: {bold ${file._id}}}`);
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
