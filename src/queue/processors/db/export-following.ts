import * as Bull from 'bull';
import * as tmp from 'tmp';
import * as fs from 'fs';
import * as mongo from 'mongodb';

import { queueLogger } from '../../logger';
import addFile from '../../../services/drive/add-file';
import User from '../../../models/user';
import dateFormat = require('dateformat');
import Following from '../../../models/following';
import { getFullApAccount } from '../../../misc/convert-host';

const logger = queueLogger.createSubLogger('export-following');

export async function exportFollowing(job: Bull.Job, done: any): Promise<void> {
	logger.info(`Exporting following of ${job.data.user._id} ...`);

	const user = await User.findOne({
		_id: new mongo.ObjectID(job.data.user._id.toString())
	});

	// Create temp file
	const [path, cleanup] = await new Promise<[string, any]>((res, rej) => {
		tmp.file((e, path, fd, cleanup) => {
			if (e) return rej(e);
			res([path, cleanup]);
		});
	});

	logger.info(`Temp file is ${path}`);

	const stream = fs.createWriteStream(path, { flags: 'a' });

	let exportedCount = 0;
	let cursor: any = null;

	while (true) {
		const followings = await Following.find({
			followerId: user._id,
			...(cursor ? { _id: { $gt: cursor } } : {})
		}, {
			limit: 100,
			sort: {
				_id: 1
			}
		});

		if (followings.length === 0) {
			job.progress(100);
			break;
		}

		cursor = followings[followings.length - 1]._id;

		for (const following of followings) {
			const u = await User.findOne({ _id: following.followeeId }, { fields: { username: true, host: true } });
			const content = getFullApAccount(u.username, u.host);
			await new Promise((res, rej) => {
				stream.write(content + '\n', err => {
					if (err) {
						logger.error(err);
						rej(err);
					} else {
						res();
					}
				});
			});
			exportedCount++;
		}

		const total = await Following.count({
			followerId: user._id,
		});

		job.progress(exportedCount / total);
	}

	stream.end();
	logger.succ(`Exported to: ${path}`);

	const fileName = 'following-' + dateFormat(new Date(), 'yyyy-mm-dd-HH-MM-ss') + '.csv';
	const driveFile = await addFile(user, path, fileName, null, null, true);

	logger.succ(`Exported to: ${driveFile._id}`);
	cleanup();
	done();
}
