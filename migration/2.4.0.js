// for Node.js interpret

const chalk = require('chalk');
const sequential = require('promise-sequential');

const { default: User } = require('../built/models/user');
const { default: DriveFile } = require('../built/models/drive-file');

async function main() {
	const promiseGens = [];

	const count = await User.count({});

	let prev;

	for (let i = 0; i < count; i++) {
		promiseGens.push(() => {
			const promise = new Promise(async (res, rej) => {
				const user = await User.findOne(prev ? {
					_id: { $gt: prev._id }
				} : {}, {
					sort: {
						_id: 1
					}
				});

				prev = user;

				const set = {};

				if (user.avatarId != null) {
					const file = await DriveFile.findOne({ _id: user.avatarId });

					if (file && file.metadata.properties.avgColor) {
						set.avatarColor = file.metadata.properties.avgColor;
					}
				}

				if (user.bannerId != null) {
					const file = await DriveFile.findOne({ _id: user.bannerId });

					if (file && file.metadata.properties.avgColor) {
						set.bannerColor = file.metadata.properties.avgColor;
					}
				}

				if (Object.keys(set).length === 0) return res([i, user]);

				User.update({
					_id: user._id
				}, {
					$set: set
				}).then(() => {
					res([i, user]);
				}).catch(rej);
			});

			promise.then(([i, user]) => {
				console.log(chalk`{gray ${i}} {green done: {bold ${user._id}} @${user.username}}`);
			});

			return promise;
		});
	}

	return await sequential(promiseGens);
}

main().then(() => {
	console.log('ALL DONE');
}).catch(console.error);
