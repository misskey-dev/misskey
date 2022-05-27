import Bull from 'bull';
import * as fs from 'node:fs';

import { queueLogger } from '../../logger.js';
import { addFile } from '@/services/drive/add-file.js';
import { format as dateFormat } from 'date-fns';
import { getFullApAccount } from '@/misc/convert-host.js';
import { createTemp } from '@/misc/create-temp.js';
import { Users, UserLists, UserListJoinings } from '@/models/index.js';
import { In } from 'typeorm';
import { DbUserJobData } from '@/queue/types.js';

const logger = queueLogger.createSubLogger('export-user-lists');

export async function exportUserLists(job: Bull.Job<DbUserJobData>, done: any): Promise<void> {
	logger.info(`Exporting user lists of ${job.data.user.id} ...`);

	const user = await Users.findOneBy({ id: job.data.user.id });
	if (user == null) {
		done();
		return;
	}

	const lists = await UserLists.findBy({
		userId: user.id,
	});

	// Create temp file
	const [path, cleanup] = await createTemp();

	logger.info(`Temp file is ${path}`);

	try {
		const stream = fs.createWriteStream(path, { flags: 'a' });

		for (const list of lists) {
			const joinings = await UserListJoinings.findBy({ userListId: list.id });
			const users = await Users.findBy({
				id: In(joinings.map(j => j.userId)),
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

		const fileName = 'user-lists-' + dateFormat(new Date(), 'yyyy-MM-dd-HH-mm-ss') + '.csv';
		const driveFile = await addFile({ user, path, name: fileName, force: true });

		logger.succ(`Exported to: ${driveFile.id}`);
	} finally {
		cleanup();
	}

	done();
}
