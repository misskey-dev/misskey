import * as debug from 'debug';

import Post from '../../../../models/post';
import { createDb } from '../../../../queue';

const log = debug('misskey:activitypub');

export default async function(uri: string) {
	log(`Deleting the Note: ${uri}`);

	const post = await Post.findOneAndDelete({ uri });

	createDb({
		type: 'deletePostDependents',
		id: post._id
	}).delay(65536).save();
}
