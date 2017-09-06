const bayes = require('./naive-bayes.js');
const MeCab = require('mecab-async');

import Post from '../../api/models/post';
import config from '../../conf';

const classifier = bayes({
	tokenizer: this.tokenizer
});

const mecab = new MeCab();
if (config.categorizer.mecab_command) mecab.command = config.categorizer.mecab_command;

// 訓練データ取得
Post.find({
	is_category_verified: true
}, {
	fields: {
		_id: false,
		text: true,
		category: true
	}
}).then(verifiedPosts => {
	// 学習
	verifiedPosts.forEach(post => {
		classifier.learn(post.text, post.category);
	});

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
			const category = classifier.categorize(post.text);

			Post.update({ _id: post._id }, {
				$set: {
					category: category
				}
			});
		});
	});
});
