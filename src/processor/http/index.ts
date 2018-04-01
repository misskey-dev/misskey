import follow from './follow';
import performActivityPub from './perform-activitypub';
import reportGitHubFailure from './report-github-failure';

const handlers = {
  follow,
  performActivityPub,
  reportGitHubFailure,
};

export default (job, done) => handlers[job.data.type](job).then(() => done(), done);
