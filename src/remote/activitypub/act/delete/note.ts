import * as debug from 'debug';

import Post from '../../../../models/post';
import { IRemoteUser } from '../../../../models/user';

const log = debug('misskey:activitypub');

export default async function(actor: IRemoteUser, uri: string): Promise<void> {
	log(`Deleting the Note: ${uri}`);

	const post = await Post.findOne({ uri });

	if (post == null) {
		throw new Error('post not found');
	}

	if (!post.userId.equals(actor._id)) {
		throw new Error('投稿を削除しようとしているユーザーは投稿の作成者ではありません');
	}

	Post.update({ _id: post._id }, {
		$set: {
			deletedAt: new Date(),
			text: null,
			textHtml: null,
			mediaIds: [],
			poll: null
		}
	});
}
