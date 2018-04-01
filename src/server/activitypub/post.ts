import * as express from 'express';
import context from '../../common/remote/activitypub/context';
import parseAcct from '../../common/user/parse-acct';
import config from '../../conf';
import DriveFile from '../../models/drive-file';
import Post from '../../models/post';
import User from '../../models/user';

const app = express();
app.disable('x-powered-by');

app.get('/@:user/:post', async (req, res, next) => {
	const accepted = req.accepts(['html', 'application/activity+json', 'application/ld+json']);
	if (!(['application/activity+json', 'application/ld+json'] as Array<any>).includes(accepted)) {
		return next();
	}

	const { username, host } = parseAcct(req.params.user);
	if (host !== null) {
		return res.sendStatus(422);
	}

	const user = await User.findOne({
		usernameLower: username.toLowerCase(),
		host: null
	});
	if (user === null) {
		return res.sendStatus(404);
	}

	const post = await Post.findOne({
		_id: req.params.post,
		userId: user._id
	});
	if (post === null) {
		return res.sendStatus(404);
	}

	const asyncFiles = DriveFile.find({ _id: { $in: post.mediaIds } });
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

	res.json({
		'@context': context,
		id: `${attributedTo}/${post._id}`,
		type: 'Note',
		attributedTo,
		content: post.textHtml,
		published: post.createdAt.toISOString(),
		to: 'https://www.w3.org/ns/activitystreams#Public',
		cc: `${attributedTo}/followers`,
		inReplyTo,
		attachment: (await asyncFiles).map(({ _id, contentType }) => ({
			type: 'Document',
			mediaType: contentType,
			url: `${config.drive_url}/${_id}`
		})),
		tag: post.tags.map(tag => ({
			type: 'Hashtag',
			href: `${config.url}/search?q=#${encodeURIComponent(tag)}`,
			name: '#' + tag
		}))
	});
});

export default app;
