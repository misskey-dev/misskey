const MeCab = require('mecab-async');

import Post from '../../api/models/post';
import User from '../../api/models/user';
import config from '../../conf';

const mecab = new MeCab();
if (config.analysis.mecab_command) mecab.command = config.analysis.mecab_command;

function tokenize(text: string) {
	const tokens = this.mecab.parseSync(text)
		// キーワードのみ
		.filter(token => token[1] == '名詞' && (token[2] == '固有名詞' || token[2] == '一般'))
		// 取り出し
		.map(token => token[0]);

	return tokens;
}

// Fetch all users
User.find({}, {
	fields: {
		_id: true
	}
}).then(users => {
	let i = -1;

	const x = cb => {
		if (++i == users.length) return cb();
		extractKeywordsOne(users[i]._id, () => x(cb));
	};

	x(() => {
		console.log('complete');
	});
});

async function extractKeywordsOne(id, cb) {
	console.log(`extract keywords of ${id} ...`);

	// Fetch recent posts
	const recentPosts = await Post.find({
		user_id: id,
		text: {
			$exists: true
		}
	}, {
		sort: {
			_id: -1
		},
		limit: 1000,
		fields: {
			_id: false,
			text: true
		}
	});

	// 投稿が少なかったら中断
	if (recentPosts.length < 10) {
		return cb();
	}

	const keywords = {};

	// Extract keywords from recent posts
	recentPosts.forEach(post => {
		const keywordsOfPost = tokenize(post.text);

		keywordsOfPost.forEach(keyword => {
			if (keywords[keyword]) {
				keywords[keyword]++;
			} else {
				keywords[keyword] = 1;
			}
		});
	});

	// Sort keywords by frequency
	const keywordsSorted = Object.keys(keywords).sort((a, b) => keywords[b] - keywords[a]);

	// Lookup top 10 keywords
	const topKeywords = keywordsSorted.slice(0, 10);

	process.stdout.write(' >>> ' + topKeywords.join(' '));

	// Save
	User.update({ _id: id }, {
		$set: {
			keywords: topKeywords
		}
	}).then(() => {
		cb();
	});
}
