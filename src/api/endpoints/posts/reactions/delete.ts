/**
 * Module dependencies
 */
import $ from 'cafy';
import Reaction from '../../../models/post-reaction';
import Post from '../../../models/post';
// import event from '../../../event';

/**
 * Unreact to a post
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'post_id' parameter
	const [postId, postIdErr] = $(params.post_id).id().$;
	if (postIdErr) return rej('invalid post_id param');

	// Fetch unreactee
	const post = await Post.findOne({
		_id: postId
	});

	if (post === null) {
		return rej('post not found');
	}

	// if already unreacted
	const exist = await Reaction.findOne({
		post_id: post._id,
		user_id: user._id,
		deleted_at: { $exists: false }
	});

	if (exist === null) {
		return rej('never reacted');
	}

	// Delete reaction
	await Reaction.update({
		_id: exist._id
	}, {
			$set: {
				deleted_at: new Date()
			}
		});

	// Send response
	res();

	const dec = {};
	dec[`reaction_counts.${exist.reaction}`] = -1;

	// Decrement reactions count
	Post.update({ _id: post._id }, {
		$inc: dec
	});
});
