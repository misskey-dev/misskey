import config from '@/config/index.js';
import { ILocalUser } from '@/models/entities/user.js';
import { AbuseUserReport } from '@/models/entities/abuse-user-report.js';

export const renderFlag = (user: ILocalUser, flag: AbuseUserReport) => {
	return {
		type: 'Flag',
		actor: `${config.url}/users/${user.id}`,
		content: flag.comment,
		object: flag.urls,
	};
};
