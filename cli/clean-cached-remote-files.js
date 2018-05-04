const chalk = require('chalk');
const log = require('single-line-log').stdout;
const sequential = require('promise-sequential');
const { default: DriveFile, DriveFileChunk } = require('../built/models/drive-file');
const { default: DriveFileThumbnail, DriveFileThumbnailChunk } = require('../built/models/drive-file-thumbnail');
const { default: User } = require('../built/models/user');

const q = {
	'metadata._user.host': {
		$ne: null
	}
};

async function main() {
	const promiseGens = [];

	const count = await DriveFile.count(q);

	let prev;

	for (let i = 0; i < count; i++) {
		promiseGens.push(() => {
			const promise = new Promise(async (res, rej) => {
				const file = await DriveFile.findOne(prev ? Object.assign({
					_id: { $lt: prev._id }
				}, q) : q, {
					sort: {
						_id: -1
					}
				});

				prev = file;

				function skip() {
					res([i, file, false]);
				}

				if (file == null) return skip();

				log(chalk`{gray ${i}} scanning {bold ${file._id}} ${file.filename} ...`);

				const attachingUsersCount = await User.count({
					$or: [{
						avatarId: file._id
					}, {
						bannerId: file._id
					}]
				}, { limit: 1 });
				if (attachingUsersCount !== 0) return skip();

				Promise.all([
					// チャンクをすべて削除
					DriveFileChunk.remove({
						files_id: file._id
					}),

					DriveFile.update({ _id: file._id }, {
						$set: {
							'metadata.deletedAt': new Date(),
							'metadata.isExpired': true
						}
					})
				]).then(async () => {
					res([i, file, true]);

					//#region サムネイルもあれば削除
					const thumbnail = await DriveFileThumbnail.findOne({
						'metadata.originalId': file._id
					});

					if (thumbnail) {
						DriveFileThumbnailChunk.remove({
							files_id: thumbnail._id
						});

						DriveFileThumbnail.remove({ _id: thumbnail._id });
					}
					//#endregion
				});
			});

			promise.then(([i, file, deleted]) => {
				if (deleted) {
					log(chalk`{gray ${i}} {red deleted: {bold ${file._id}} ${file.filename}}`);
				} else {
					log(chalk`{gray ${i}} {green skipped: {bold ${file._id}} ${file.filename}}`);
				}
				log.clear();
				console.log();
			});

			return promise;
		});
	}

	return await sequential(promiseGens);
}

main().then(() => {
	console.log('ALL DONE');
}).catch(console.error);
