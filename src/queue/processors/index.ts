import deliver from './http/deliver';
import processInbox from './http/process-inbox';
import { exportNotes } from './export-notes';
import { queueLogger } from '../logger';

const handlers: any = {
	deliver,
	processInbox,
	exportNotes,
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
