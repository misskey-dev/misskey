import Post from '../../api/models/post';
import User from '../../api/models/user';

export async function predictOne(id) {
	console.log(`predict interest of ${id} ...`);

	// TODO: repostなども含める
	const recentPosts = await Post.find({
		userId: id,
		category: {
			$exists: true
		}
	}, {
		sort: {
			_id: -1
		},
		limit: 1000,
		fields: {
			_id: false,
			category: true
		}
	});

	const categories = {};

	recentPosts.forEach(post => {
		if (categories[post.category]) {
			categories[post.category]++;
		} else {
			categories[post.category] = 1;
		}
	});
}

export async function predictAll() {
	const allUsers = await User.find({}, {
		fields: {
			_id: true
		}
	});

	allUsers.forEach(user => {
		predictOne(user._id);
	});
}
