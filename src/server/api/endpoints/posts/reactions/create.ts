/**
 * Module dependencies
 */
import $ from 'cafy';
import Reaction from '../../../../../models/post-reaction';
import Post from '../../../../../models/post';
import create from '../../../../../services/post/reaction/create';

/**
 * React to a post
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'postId' parameter
	const [postId, postIdErr] = $(params.postId).id().$;
	if (postIdErr) return rej('invalid postId param');

	// Get 'reaction' parameter
	const [reaction, reactionErr] = $(params.reaction).string().or([
		'like',
		'love',
		'laugh',
		'hmm',
		'surprise',
		'congrats',
		'angry',
		'confused',
		'pudding'
	]).$;
	if (reactionErr) return rej('invalid reaction param');

	// Fetch reactee
	const post = await Post.findOne({
		_id: postId
	});

	if (post === null) {
		return rej('post not found');
	}

	try {
		await create(user, post, reaction);
	} catch (e) {
		rej(e);
	}

	res();
});
