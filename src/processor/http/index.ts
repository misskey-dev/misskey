import follow from './follow';
import performActivityPub from './perform-activitypub';
import processInbox from './process-inbox';
import reportGitHubFailure from './report-github-failure';

const handlers = {
  follow,
  performActivityPub,
  processInbox,
  reportGitHubFailure,
};

export default (job, done) => handlers[job.data.type](job).then(() => done(), done);
