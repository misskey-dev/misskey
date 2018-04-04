import * as kue from 'kue';

import request from '../../../remote/request';

export default async (job: kue.Job, done): Promise<void> => {
	await request(job.data.user, job.data.to, job.data.content);
};
