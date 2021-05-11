import * as Bull from 'bull';
import * as tmp from 'tmp';
import * as fs from 'fs';

import { queueLogger } from '../../logger';
import addFile from '../../../services/drive/add-file';
import dateFormat = require('dateformat');
import { getFullApAccount } from '@/misc/convert-host';
import { Users, UserLists, UserListJoinings } from '../../../models';
import { In } from 'typeorm';
import { DbUserJobData } from '@/queue/types';

const logger = queueLogger.createSubLogger('export-user-lists');

export async function exportUserLists(job: Bull.Job<DbUserJobData>, done: any): Promise<void> {
	logger.info(`Exporting user lists of ${job.data.user.id} ...`);

	const user = await Users.findOne(job.data.user.id);
	if (user == null) {
		done();
		return;
	}

	const lists = await UserLists.find({
		userId: user.id
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
		const joinings = await UserListJoinings.find({ userListId: list.id });
		const users = await Users.find({
			id: In(joinings.map(j => j.userId))
		});

		for (const u of users) {
			const acct = getFullApAccount(u.username, u.host);
			const content = `${list.name},${acct}`;
			await new Promise<void>((res, rej) => {
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
	const driveFile = await addFile(user, path, fileName, null, null, true);

	logger.succ(`Exported to: ${driveFile.id}`);
	cleanup();
	done();
}
