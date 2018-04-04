import Post from '../../../models/post';
import { createDb } from '../../../queue';

export default async ({ $id }) => {
	const promisedDeletion = Post.findOneAndDelete({ _id: $id });

	await new Promise((resolve, reject) => createDb({
		type: 'deletePostDependents',
		id: $id
	}).delay(65536).save(error => error ? reject(error) : resolve()));

	return promisedDeletion;
};
