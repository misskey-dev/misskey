import * as bq from 'bee-queue';
import * as tmp from 'tmp';
import * as fs from 'fs';
import * as mongo from 'mongodb';

import { queueLogger } from '../logger';
import addFile from '../../services/drive/add-file';
import User from '../../models/user';
import dateFormat = require('dateformat');
import Blocking from '../../models/blocking';
import config from '../../config';

const logger = queueLogger.createSubLogger('export-blocking');

export async function exportBlocking(job: bq.Job, done: any): Promise<void> {
	logger.info(`Exporting blocking of ${job.data.user._id} ...`);

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
		const blockings = await Blocking.find({
			blockerId: user._id,
			...(cursor ? { _id: { $gt: cursor } } : {})
		}, {
			limit: 100,
			sort: {
				_id: 1
			}
		});

		if (blockings.length === 0) {
			ended = true;
			if (job.reportProgress) job.reportProgress(100);
			break;
		}

		cursor = blockings[blockings.length - 1]._id;

		for (const block of blockings) {
			const u = await User.findOne({ _id: block.blockeeId }, { fields: { username: true, host: true } });
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

		const total = await Blocking.count({
			blockerId: user._id,
		});

		if (job.reportProgress) job.reportProgress(exportedCount / total);
	}

	stream.end();
	logger.succ(`Exported to: ${path}`);

	const fileName = 'blocking-' + dateFormat(new Date(), 'yyyy-mm-dd-HH-MM-ss') + '.csv';
	const driveFile = await addFile(user, path, fileName);

	logger.succ(`Exported to: ${driveFile._id}`);
	cleanup();
	done();
}
