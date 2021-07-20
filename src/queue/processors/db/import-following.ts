import * as Bull from 'bull';

import { queueLogger } from '../../logger';
import follow from '../../../services/following/create';
import { parseAcct } from '@/misc/acct';
import { resolveUser } from '../../../remote/resolve-user';
import { downloadTextFile } from '@/misc/download-text-file';
import { isSelfHost, toPuny } from '@/misc/convert-host';
import { Users, DriveFiles } from '../../../models';
import { DbUserImportJobData } from '@/queue/types';

const logger = queueLogger.createSubLogger('import-following');

export async function importFollowing(job: Bull.Job<DbUserImportJobData>, done: any): Promise<void> {
	logger.info(`Importing following of ${job.data.user.id} ...`);

	const user = await Users.findOne(job.data.user.id);
	if (user == null) {
		done();
		return;
	}

	const file = await DriveFiles.findOne({
		id: job.data.fileId
	});
	if (file == null) {
		done();
		return;
	}

	const csv = await downloadTextFile(file.url);

	let linenum = 0;

	for (const line of csv.trim().split('\n')) {
		linenum++;

		try {
			const acct = line.split(',')[0].trim();
			const { username, host } = parseAcct(acct);

			let target = isSelfHost(host!) ? await Users.findOne({
				host: null,
				usernameLower: username.toLowerCase()
			}) : await Users.findOne({
				host: toPuny(host!),
				usernameLower: username.toLowerCase()
			});

			if (host == null && target == null) continue;

			if (target == null) {
				target = await resolveUser(username, host);
			}

			if (target == null) {
				throw `cannot resolve user: @${username}@${host}`;
			}

			// skip myself
			if (target.id === job.data.user.id) continue;

			logger.info(`Follow[${linenum}] ${target.id} ...`);

			follow(user, target);
		} catch (e) {
			logger.warn(`Error in line:${linenum} ${e}`);
		}
	}

	logger.succ('Imported');
	done();
}
