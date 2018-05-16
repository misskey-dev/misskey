// for Node.js interpret

const chalk = require('chalk');
const sequential = require('promise-sequential');

const { default: User } = require('../built/models/user');
const { default: DriveFile } = require('../built/models/drive-file');

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

				const user = await User.findOne({ _id: file.metadata.userId });

				DriveFile.update({
					_id: file._id
				}, {
					$set: {
						'metadata._user': {
							host: user.host
						}
					}
				}).then(() => {
					res([i, file]);
				}).catch(rej);
			});

			promise.then(([i, file]) => {
				console.log(chalk`{gray ${i}} {green done: {bold ${file._id}} ${file.filename}}`);
			});

			return promise;
		});
	}

	return await sequential(promiseGens);
}

main().then(() => {
	console.log('ALL DONE');
}).catch(console.error);
