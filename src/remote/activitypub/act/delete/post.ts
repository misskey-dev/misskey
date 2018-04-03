import Post from '../../../../models/post';
import queue from '../../../../queue';

export default ({ $id }) => Promise.all([
	Post.findOneAndDelete({ _id: $id }),
	new Promise((resolve, reject) => queue.create('db', {
		type: 'deletePostDependents',
		id: $id
	}).delay(65536).save(error => error ? reject(error) : resolve()))
]);
