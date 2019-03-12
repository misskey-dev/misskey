import * as Bull from 'bull';
import * as mongo from 'mongodb';

import { queueLogger } from '../../logger';
import User from '../../../models/user';
import config from '../../../config';
import follow from '../../../services/following/create';
import DriveFile from '../../../models/drive-file';
import { getOriginalUrl } from '../../../misc/get-drive-file-url';
import parseAcct from '../../../misc/acct/parse';
import resolveUser from '../../../remote/resolve-user';
import { downloadTextFile } from '../../../misc/download-text-file';

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

	for (const line of csv.trim().split('\n')) {
		const { username, host } = parseAcct(line.trim());

		let target = host === config.host ? await User.findOne({
			host: null,
			usernameLower: username.toLowerCase()
		}) : await User.findOne({
			host: host,
			usernameLower: username.toLowerCase()
		});

		if (host == null && target == null) continue;

		if (target == null) {
			target = await resolveUser(username, host);
		}

		follow(user, target);
	}

	logger.succ('Imported');
	done();
}
