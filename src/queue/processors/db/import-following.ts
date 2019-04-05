import * as Bull from 'bull';
import * as mongo from 'mongodb';

import { queueLogger } from '../../logger';
import User from '../../../models/user';
import follow from '../../../services/following/create';
import DriveFile from '../../../models/drive-file';
import { getOriginalUrl } from '../../../misc/get-drive-file-url';
import parseAcct from '../../../misc/acct/parse';
import resolveUser from '../../../remote/resolve-user';
import { downloadTextFile } from '../../../misc/download-text-file';
import { isSelfHost, toDbHost } from '../../../misc/convert-host';

const logger = queueLogger.createSubLogger('import-following');

export async function importFollowing(job: Bull.Job, done: any): Promise<void> {
	logger.info(`Importing following of ${job.data.user._id} ...`);

	const user = await User.findOne({
		_id: new mongo.ObjectID(job.data.user._id.toString())
	});

	const file = await DriveFile.findOne({
		_id: new mongo.ObjectID(job.data.fileId.toString())
	});

	const url = getOriginalUrl(file);

	const csv = await downloadTextFile(url);

	let linenum = 0;

	for (const line of csv.trim().split('\n')) {
		linenum++;

		try {
			const { username, host } = parseAcct(line.trim());

			let target = isSelfHost(host) ? await User.findOne({
				host: null,
				usernameLower: username.toLowerCase()
			}) : await User.findOne({
				host: toDbHost(host),
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
			if (target._id.equals(job.data.user._id)) continue;

			logger.info(`Follow[${linenum}] ${target._id} ...`);

			follow(user, target);
		} catch (e) {
			logger.warn(`Error in line:${linenum} ${e}`);
		}
	}

	logger.succ('Imported');
	done();
}
