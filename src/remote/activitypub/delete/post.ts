import Post from '../../../models/post';
import queue from '../../../queue';

export default async ({ $id }) => {
	const promisedDeletion = Post.findOneAndDelete({ _id: $id });

	await new Promise((resolve, reject) => queue.create('db', {
		type: 'deletePostDependents',
		id: $id
	}).delay(65536).save(error => error ? reject(error) : resolve()));

	return promisedDeletion;
};
