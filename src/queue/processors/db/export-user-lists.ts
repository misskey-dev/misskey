import * as Bull from 'bull';
import * as tmp from 'tmp';
import * as fs from 'fs';
import * as mongo from 'mongodb';

import { queueLogger } from '../../logger';
import addFile from '../../../services/drive/add-file';
import User from '../../../models/user';
import dateFormat = require('dateformat');
import UserList from '../../../models/user-list';
import { getFullApAccount } from '../../../misc/convert-host';

const logger = queueLogger.createSubLogger('export-user-lists');

export async function exportUserLists(job: Bull.Job, done: any): Promise<void> {
	logger.info(`Exporting user lists of ${job.data.user._id} ...`);

	const user = await User.findOne({
		_id: new mongo.ObjectID(job.data.user._id.toString())
	});

	const lists = await UserList.find({
		userId: user._id
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

	for (const list of lists) {
		const users = await User.find({
			_id: { $in: list.userIds }
		}, {
			fields: {
				username: true,
				host: true
			}
		});

		for (const u of users) {
			const acct = getFullApAccount(u.username, u.host);
			const content = `${list.title},${acct}`;
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
		}
	}

	stream.end();
	logger.succ(`Exported to: ${path}`);

	const fileName = 'user-lists-' + dateFormat(new Date(), 'yyyy-mm-dd-HH-MM-ss') + '.csv';
	const driveFile = await addFile(user, path, fileName);

	logger.succ(`Exported to: ${driveFile._id}`);
	cleanup();
	done();
}
