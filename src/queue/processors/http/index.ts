import deliver from './deliver';
import processInbox from './process-inbox';

const handlers = {
	deliver,
	processInbox,
};

export default (job, done) => {
	const handler = handlers[job.data.type];

	if (handler) {
		handler(job, done);
	} else {
		console.error(`Unknown job: ${job.data.type}`);
		done();
	}
};
