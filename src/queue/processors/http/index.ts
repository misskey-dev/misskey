import deliver from './deliver';
import processInbox from './process-inbox';
import reportGitHubFailure from './report-github-failure';

const handlers = {
	deliver,
	processInbox,
	reportGitHubFailure
};

export default (job, done) => {
	const handler = handlers[job.data.type];

	if (handler) {
		handler(job, done);
	} else {
		console.warn(`Unknown job: ${job.data.type}`);
		done();
	}
};
