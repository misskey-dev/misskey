import deliver from './deliver';
import processInbox from './process-inbox';
import { queueLogger } from '../..';

const handlers: any = {
	deliver,
	processInbox,
};

export default (job: any, done: any) => {
	const handler = handlers[job.data.type];

	if (handler) {
		handler(job, done);
	} else {
		queueLogger.error(`Unknown job: ${job.data.type}`);
		done();
	}
};
