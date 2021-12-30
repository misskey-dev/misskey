import * as Bull from 'bull';
import * as tmp from 'tmp';
import * as fs from 'fs';

import { queueLogger } from '../../logger';
import addFile from '@/services/drive/add-file';
import * as dateFormat from 'dateformat';
import { getFullApAccount } from '@/misc/convert-host';
import { Users, Followings, Mutings } from '@/models/index';
import { In, MoreThan, Not } from 'typeorm';
import { DbUserJobData } from '@/queue/types';
import { Following } from '@/models/entities/following';

const logger = queueLogger.createSubLogger('export-following');

export async function exportFollowing(job: Bull.Job<DbUserJobData>, done: () => void): Promise<void> {
	logger.info(`Exporting following of ${job.data.user.id} ...`);

	const user = await Users.findOne(job.data.user.id);
	if (user == null) {
		done();
		return;
	}

	// Create temp file
	const [path, cleanup] = await new Promise<[string, () => void]>((res, rej) => {
		tmp.file((e, path, fd, cleanup) => {
			if (e) return rej(e);
			res([path, cleanup]);
		});
	});

	logger.info(`Temp file is ${path}`);

	const stream = fs.createWriteStream(path, { flags: 'a' });

	let cursor: Following['id'] | null = null;

	const mutings = job.data.excludeMuting ? await Mutings.find({
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
		});

		if (followings.length === 0) {
			break;
		}

		cursor = followings[followings.length - 1].id;

		for (const following of followings) {
			const u = await Users.findOne({ id: following.followeeId });
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

	const fileName = 'following-' + dateFormat(new Date(), 'yyyy-mm-dd-HH-MM-ss') + '.csv';
	const driveFile = await addFile(user, path, fileName, null, null, true);

	logger.succ(`Exported to: ${driveFile.id}`);
	cleanup();
	done();
}
