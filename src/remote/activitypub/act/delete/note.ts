import * as debug from 'debug';

import Post from '../../../../models/post';
import { createDb } from '../../../../queue';

const log = debug('misskey:activitypub');

export default async function(actor, uri: string) {
	log(`Deleting the Note: ${uri}`);

	const post = await Post.findOne({ uri });

	if (post == null) {
		throw new Error('post not found');
	}

	if (post.userId !== actor._id) {
		throw new Error('投稿を削除しようとしているユーザーは投稿の作成者ではありません');
	}

	Post.remove({ _id: post._id });

	createDb({
		type: 'deletePostDependents',
		id: post._id
	}).delay(65536).save();
}
