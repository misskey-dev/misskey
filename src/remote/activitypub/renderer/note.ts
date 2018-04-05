import renderDocument from './document';
import renderHashtag from './hashtag';
import config from '../../../config';
import DriveFile from '../../../models/drive-file';
import Post, { IPost } from '../../../models/post';
import User, { IUser } from '../../../models/user';

export default async (user: IUser, post: IPost) => {
	const promisedFiles = post.mediaIds
		? DriveFile.find({ _id: { $in: post.mediaIds } })
		: Promise.resolve([]);

	let inReplyTo;

	if (post.replyId) {
		const inReplyToPost = await Post.findOne({
			_id: post.replyId,
		});

		if (inReplyToPost !== null) {
			const inReplyToUser = await User.findOne({
				_id: post.userId,
			});

			if (inReplyToUser !== null) {
				inReplyTo = `${config.url}@${inReplyToUser.username}/${inReplyToPost._id}`;
			}
		}
	} else {
		inReplyTo = null;
	}

	const attributedTo = `${config.url}/@${user.username}`;

	return {
		id: `${attributedTo}/${post._id}`,
		type: 'Note',
		attributedTo,
		content: post.textHtml,
		published: post.createdAt.toISOString(),
		to: 'https://www.w3.org/ns/activitystreams#Public',
		cc: `${attributedTo}/followers`,
		inReplyTo,
		attachment: (await promisedFiles).map(renderDocument),
		tag: (post.tags || []).map(renderHashtag)
	};
};
