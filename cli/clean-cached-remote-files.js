const chalk = require('chalk');
const log = require('single-line-log').stdout;
const sequential = require('promise-sequential');
const { default: DriveFile, DriveFileChunk } = require('../built/models/drive-file');
const { default: DriveFileThumbnail, DriveFileThumbnailChunk } = require('../built/models/drive-file-thumbnail');
const { default: Note } = require('../built/models/note');
const { default: MessagingMessage } = require('../built/models/messaging-message');
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

				if (file == null) return res([i, null]);

				// チャンクをすべて削除
				await DriveFileChunk.remove({
					files_id: file._id
				});

				await DriveFile.update({ _id: file._id }, {
					$set: {
						'metadata.deletedAt': new Date(),
						'metadata.isExpired': true
					}
				});

				res([i, file]);

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

			promise.then(([i, file]) => {
				if (file) {
					console.log(chalk`{gray ${i}} {green done: {bold ${file._id}} ${file.filename}}`);
				}
			});

			return promise;
		});
	}

	return await sequential(promiseGens);
}

main().then(() => {
	console.log('ALL DONE');
}).catch(console.error);
