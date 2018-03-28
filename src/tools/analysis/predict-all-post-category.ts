import Post from '../../server/api/models/post';
import Core from './core';

const c = new Core();

c.init().then(() => {
	// 全ての(人間によって証明されていない)投稿を取得
	Post.find({
		text: {
			$exists: true
		},
		is_category_verified: {
			$ne: true
		}
	}, {
		sort: {
			_id: -1
		},
		fields: {
			_id: true,
			text: true
		}
	}).then(posts => {
		posts.forEach(post => {
			console.log(`predicting... ${post._id}`);
			const category = c.predict(post.text);

			Post.update({ _id: post._id }, {
				$set: {
					category: category
				}
			});
		});
	});
});
