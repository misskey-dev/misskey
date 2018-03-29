import queue from '../queue';
import reportGitHubFailure from './report-github-failure';

export default () => queue.process('gitHubFailureReport', reportGitHubFailure);
