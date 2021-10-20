import * as Bull from 'bull';

import { queueLogger } from '../../logger';
import { parseAcct } from '@/misc/acct';
import { resolveUser } from '@/remote/resolve-user';
import { downloadTextFile } from '@/misc/download-text-file';
import { isSelfHost, toPuny } from '@/misc/convert-host';
import { Users, DriveFiles, Mutings } from '@/models/index';
import { DbUserImportJobData } from '@/queue/types';
import { User } from '@/models/entities/user';
import { genId } from '@/misc/gen-id';

const logger = queueLogger.createSubLogger('import-muting');

export async function importMuting(job: Bull.Job<DbUserImportJobData>, done: any): Promise<void> {
	logger.info(`Importing muting of ${job.data.user.id} ...`);

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

			logger.info(`Mute[${linenum}] ${target.id} ...`);

			await mute(user, target);
		} catch (e) {
			logger.warn(`Error in line:${linenum} ${e}`);
		}
	}

	logger.succ('Imported');
	done();
}

async function mute(user: User, target: User) {
	await Mutings.insert({
		id: genId(),
		createdAt: new Date(),
		muterId: user.id,
		muteeId: target.id,
	});
}
