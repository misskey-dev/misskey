import deletePostDependents from './delete-post-dependents';

const handlers = {
  deletePostDependents
};

export default (job, done) => handlers[job.data.type](job, done);
