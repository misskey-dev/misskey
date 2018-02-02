/**
 * Module dependencies
 */
import $ from 'cafy';
import Post from '../../models/post';
import User, { pack } from '../../models/user';

module.exports = (params, me) => new Promise(async (res, rej) => {
	// Get 'user_id' parameter
	const [userId, userIdErr] = $(params.user_id).id().$;
	if (userIdErr) return rej('invalid user_id param');

	// Get 'limit' parameter
	const [limit = 10, limitErr] = $(params.limit).optional.number().range(1, 100).$;
	if (limitErr) return rej('invalid limit param');

	// Lookup user
	const user = await User.findOne({
		_id: userId
	}, {
		fields: {
			_id: true
		}
	});

	if (user === null) {
		return rej('user not found');
	}

	// Fetch recent posts
	const recentPosts = await Post.find({
		user_id: user._id,
		reply_id: {
			$exists: true,
			$ne: null
		}
	}, {
		sort: {
			_id: -1
		},
		limit: 1000,
		fields: {
			_id: false,
			reply_id: true
		}
	});

	// 投稿が少なかったら中断
	if (recentPosts.length === 0) {
		return res([]);
	}

	const replyTargetPosts = await Post.find({
		_id: {
			$in: recentPosts.map(p => p.reply_id)
		},
		user_id: {
			$ne: user._id
		}
	}, {
		fields: {
			_id: false,
			user_id: true
		}
	});

	const repliedUsers = {};

	// Extract replies from recent posts
	replyTargetPosts.forEach(post => {
		const userId = post.user_id.toString();
		if (repliedUsers[userId]) {
			repliedUsers[userId]++;
		} else {
			repliedUsers[userId] = 1;
		}
	});

	// Calc peak
	let peak = 0;
	Object.keys(repliedUsers).forEach(user => {
		if (repliedUsers[user] > peak) peak = repliedUsers[user];
	});

	// Sort replies by frequency
	const repliedUsersSorted = Object.keys(repliedUsers).sort((a, b) => repliedUsers[b] - repliedUsers[a]);

	// Extract top replied users
	const topRepliedUsers = repliedUsersSorted.slice(0, limit);

	// Make replies object (includes weights)
	const repliesObj = await Promise.all(topRepliedUsers.map(async (user) => ({
		user: await pack(user, me, { detail: true }),
		weight: repliedUsers[user] / peak
	})));

	// Response
	res(repliesObj);
});
