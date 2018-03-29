/**
 * Module dependencies
 */
import $ from 'cafy';
import Reaction from '../../../../../models/post-reaction';
import Post from '../../../../../models/post';
// import event from '../../../event';

/**
 * Unreact to a post
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'postId' parameter
	const [postId, postIdErr] = $(params.postId).id().$;
	if (postIdErr) return rej('invalid postId param');

	// Fetch unreactee
	const post = await Post.findOne({
		_id: postId
	});

	if (post === null) {
		return rej('post not found');
	}

	// if already unreacted
	const exist = await Reaction.findOne({
		postId: post._id,
		userId: user._id,
		deletedAt: { $exists: false }
	});

	if (exist === null) {
		return rej('never reacted');
	}

	// Delete reaction
	await Reaction.update({
		_id: exist._id
	}, {
			$set: {
				deletedAt: new Date()
			}
		});

	// Send response
	res();

	const dec = {};
	dec[`reactionCounts.${exist.reaction}`] = -1;

	// Decrement reactions count
	Post.update({ _id: post._id }, {
		$inc: dec
	});
});
