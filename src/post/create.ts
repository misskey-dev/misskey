import Post from '../models/post';

export default async (post, reply, repost, mentions) => {
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

	await Promise.all(mentions.map(({ _id }) => addMention(_id)));

	return Post.insert(post);
};
