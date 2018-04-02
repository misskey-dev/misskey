import parseAcct from '../acct/parse';
import Post from '../models/post';
import User from '../models/user';

export default async (post, reply, repost, atMentions) => {
	post.mentions = [];

	function addMention(mentionee) {
		// Reject if already added
		if (post.mentions.some(x => x.equals(mentionee))) return;

		// Add mention
		post.mentions.push(mentionee);
	}

	if (reply) {
		// Add mention
		addMention(reply.userId);
		post.replyId = reply._id;
		post._reply = { userId: reply.userId };
	} else {
		post.replyId = null;
		post._reply = null;
	}

	if (repost) {
		if (post.text) {
			// Add mention
			addMention(repost.userId);
		}

		post.repostId = repost._id;
		post._repost = { userId: repost.userId };
	} else {
		post.repostId = null;
		post._repost = null;
	}

	await Promise.all(atMentions.map(async mention => {
		// Fetch mentioned user
		// SELECT _id
		const { _id } = await User
			.findOne(parseAcct(mention), { _id: true });

		// Add mention
		addMention(_id);
	}));

	return Post.insert(post);
};
