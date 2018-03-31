import performActivityPub from './perform-activitypub';
import reportGitHubFailure from './report-github-failure';

const handlers = {
  performActivityPub,
  reportGitHubFailure,
};

export default (job, done) => handlers[job.data.type](job).then(() => done(), done);
