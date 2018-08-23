const { default: Stats } = require('../../built/models/stats');
const { default: User } = require('../../built/models/user');
const { default: Note } = require('../../built/models/note');
const { default: DriveFile } = require('../../built/models/drive-file');

const now = new Date();
const y = now.getFullYear();
const m = now.getMonth();
const d = now.getDate();
const h = now.getHours();
const date = new Date(y, m, d, h);

async function main() {
	await Stats.update({}, {
		$set: {
			span: 'day'
		}
	}, {
		multi: true
	});

	const localUsersCount = await User.count({
		host: null
	});

	const remoteUsersCount = await User.count({
		host: { $ne: null }
	});

	const localNotesCount = await Note.count({
		'_user.host': null
	});

	const remoteNotesCount = await Note.count({
		'_user.host': { $ne: null }
	});

	const localDriveFilesCount = await DriveFile.count({
		'metadata._user.host': null
	});

	const remoteDriveFilesCount = await DriveFile.count({
		'metadata._user.host': { $ne: null }
	});

	const localDriveFilesSize = await DriveFile
		.aggregate([{
			$match: {
				'metadata._user.host': null,
				'metadata.deletedAt': { $exists: false }
			}
		}, {
			$project: {
				length: true
			}
		}, {
			$group: {
				_id: null,
				usage: { $sum: '$length' }
			}
		}])
		.then(aggregates => {
			if (aggregates.length > 0) {
				return aggregates[0].usage;
			}
			return 0;
		});

	const remoteDriveFilesSize = await DriveFile
		.aggregate([{
			$match: {
				'metadata._user.host': { $ne: null },
				'metadata.deletedAt': { $exists: false }
			}
		}, {
			$project: {
				length: true
			}
		}, {
			$group: {
				_id: null,
				usage: { $sum: '$length' }
			}
		}])
		.then(aggregates => {
			if (aggregates.length > 0) {
				return aggregates[0].usage;
			}
			return 0;
		});

	await Stats.insert({
		date: date,
		span: 'hour',
		users: {
			local: {
				total: localUsersCount,
				diff: 0
			},
			remote: {
				total: remoteUsersCount,
				diff: 0
			}
		},
		notes: {
			local: {
				total: localNotesCount,
				diff: 0,
				diffs: {
					normal: 0,
					reply: 0,
					renote: 0
				}
			},
			remote: {
				total: remoteNotesCount,
				diff: 0,
				diffs: {
					normal: 0,
					reply: 0,
					renote: 0
				}
			}
		},
		drive: {
			local: {
				totalCount: localDriveFilesCount,
				totalSize: localDriveFilesSize,
				diffCount: 0,
				diffSize: 0
			},
			remote: {
				totalCount: remoteDriveFilesCount,
				totalSize: remoteDriveFilesSize,
				diffCount: 0,
				diffSize: 0
			}
		}
	});

	console.log('done');
}

main();
