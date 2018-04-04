import deliver from './deliver';
import processInbox from './process-inbox';
import reportGitHubFailure from './report-github-failure';

const handlers = {
  deliver,
  processInbox,
  reportGitHubFailure,
};

export default (job, done) => handlers[job.data.type](job).then(() => done(), done);
