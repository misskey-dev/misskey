import { IsNull } from 'typeorm';
import * as Acct from '@/misc/acct.js';

import { resolveUser } from '@/services/remote/resolve-user.js';
import { downloadTextFile } from '@/misc/download-text-file.js';
import { isSelfHost, toPuny } from '@/misc/convert-host.js';
import { Users, DriveFiles, Blockings } from '@/models/index.js';
import type { DbUserImportJobData } from '@/queue/types.js';
import block from '@/services/blocking/create.js';
import { queueLogger } from '../../logger.js';
import type Bull from 'bull';

const logger = queueLogger.createSubLogger('import-blocking');

export async function importBlocking(job: Bull.Job<DbUserImportJobData>, done: any): Promise<void> {
	logger.info(`Importing blocking of ${job.data.user.id} ...`);

	const user = await Users.findOneBy({ id: job.data.user.id });
	if (user == null) {
		done();
		return;
	}

	const file = await DriveFiles.findOneBy({
		id: job.data.fileId,
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
			const { username, host } = Acct.parse(acct);

			let target = isSelfHost(host!) ? await Users.findOneBy({
				host: IsNull(),
				usernameLower: username.toLowerCase(),
			}) : await Users.findOneBy({
				host: toPuny(host!),
				usernameLower: username.toLowerCase(),
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

			logger.info(`Block[${linenum}] ${target.id} ...`);

			await block(user, target);
		} catch (e) {
			logger.warn(`Error in line:${linenum} ${e}`);
		}
	}

	logger.succ('Imported');
	done();
}

