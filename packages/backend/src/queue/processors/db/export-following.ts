import Bull from 'bull';
import * as fs from 'node:fs';

import { queueLogger } from '../../logger.js';
import { addFile } from '@/services/drive/add-file.js';
import { format as dateFormat } from 'date-fns';
import { getFullApAccount } from '@/misc/convert-host.js';
import { createTemp } from '@/misc/create-temp.js';
import { Users, Followings, Mutings } from '@/models/index.js';
import { In, MoreThan, Not } from 'typeorm';
import { DbUserJobData } from '@/queue/types.js';
import { Following } from '@/models/entities/following.js';

const logger = queueLogger.createSubLogger('export-following');

export async function exportFollowing(job: Bull.Job<DbUserJobData>, done: () => void): Promise<void> {
	logger.info(`Exporting following of ${job.data.user.id} ...`);

	const user = await Users.findOneBy({ id: job.data.user.id });
	if (user == null) {
		done();
		return;
	}

	// Create temp file
	const [path, cleanup] = await createTemp();

	logger.info(`Temp file is ${path}`);

	try {
		const stream = fs.createWriteStream(path, { flags: 'a' });

		let cursor: Following['id'] | null = null;

		const mutings = job.data.excludeMuting ? await Mutings.findBy({
			muterId: user.id,
		}) : [];

		while (true) {
			const followings = await Followings.find({
				where: {
					followerId: user.id,
					...(mutings.length > 0 ? { followeeId: Not(In(mutings.map(x => x.muteeId))) } : {}),
					...(cursor ? { id: MoreThan(cursor) } : {}),
				},
				take: 100,
				order: {
					id: 1,
				},
			}) as Following[];

			if (followings.length === 0) {
				break;
			}

			cursor = followings[followings.length - 1].id;

			for (const following of followings) {
				const u = await Users.findOneBy({ id: following.followeeId });
				if (u == null) {
					continue;
				}

				if (job.data.excludeInactive && u.updatedAt && (Date.now() - u.updatedAt.getTime() > 1000 * 60 * 60 * 24 * 90)) {
					continue;
				}

				const content = getFullApAccount(u.username, u.host);
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

		const fileName = 'following-' + dateFormat(new Date(), 'yyyy-MM-dd-HH-mm-ss') + '.csv';
		const driveFile = await addFile({ user, path, name: fileName, force: true });

		logger.succ(`Exported to: ${driveFile.id}`);
	} finally {
		cleanup();
	}

	done();
}
