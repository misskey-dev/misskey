import * as bq from 'bee-queue';
import * as tmp from 'tmp';
import * as fs from 'fs';
import * as mongo from 'mongodb';

import { queueLogger } from '../logger';
import addFile from '../../services/drive/add-file';
import User from '../../models/user';
import dateFormat = require('dateformat');
import Following from '../../models/following';
import config from '../../config';

const logger = queueLogger.createSubLogger('export-following');

export async function exportFollowing(job: bq.Job, done: any): Promise<void> {
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
	let ended = false;
	let cursor: any = null;

	while (!ended) {
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
			ended = true;
			if (job.reportProgress) job.reportProgress(100);
			break;
		}

		cursor = followings[followings.length - 1]._id;

		for (const following of followings) {
			const u = await User.findOne({ _id: following.followeeId }, { fields: { username: true, host: true } });
			const content = u.host ? `${u.username}@${u.host}` : `${u.username}@${config.host}`;
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

		if (job.reportProgress) job.reportProgress(exportedCount / total);
	}

	stream.end();
	logger.succ(`Exported to: ${path}`);

	const fileName = 'following-' + dateFormat(new Date(), 'yyyy-mm-dd-HH-MM-ss') + '.csv';
	const driveFile = await addFile(user, path, fileName);

	logger.succ(`Exported to: ${driveFile._id}`);
	cleanup();
	done();
}
