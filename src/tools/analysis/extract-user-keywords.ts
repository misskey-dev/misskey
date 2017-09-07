const MeCab = require('./mecab');
import Post from '../../api/models/post';
import User from '../../api/models/user';
import parse from '../../api/common/text';

const stopwords = [
	'ー',

	'の', 'に', 'は', 'を', 'た', 'が', 'で', 'て', 'と', 'し', 'れ', 'さ',
  'ある', 'いる', 'も', 'する', 'から', 'な', 'こと', 'として', 'い', 'や', 'れる',
  'など', 'なっ', 'ない', 'この', 'ため', 'その', 'あっ', 'よう', 'また', 'もの',
  'という', 'あり', 'まで', 'られ', 'なる', 'へ', 'か', 'だ', 'これ', 'によって',
  'により', 'おり', 'より', 'による', 'ず', 'なり', 'られる', 'において', 'ば', 'なかっ',
  'なく', 'しかし', 'について', 'せ', 'だっ', 'その後', 'できる', 'それ', 'う', 'ので',
  'なお', 'のみ', 'でき', 'き', 'つ', 'における', 'および', 'いう', 'さらに', 'でも',
  'ら', 'たり', 'その他', 'に関する', 'たち', 'ます', 'ん', 'なら', 'に対して', '特に',
  'せる', '及び', 'これら', 'とき', 'では', 'にて', 'ほか', 'ながら', 'うち', 'そして',
  'とともに', 'ただし', 'かつて', 'それぞれ', 'または', 'お', 'ほど', 'ものの', 'に対する',
  'ほとんど', 'と共に', 'といった', 'です', 'とも', 'ところ', 'ここ', '感じ', '気持ち',

	'about', 'after', 'all', 'also', 'am', 'an', 'and', 'another', 'any', 'are', 'as', 'at', 'be',
  'because', 'been', 'before', 'being', 'between', 'both', 'but', 'by', 'came', 'can',
  'come', 'could', 'did', 'do', 'each', 'for', 'from', 'get', 'got', 'has', 'had',
  'he', 'have', 'her', 'here', 'him', 'himself', 'his', 'how', 'if', 'in', 'into',
  'is', 'it', 'like', 'make', 'many', 'me', 'might', 'more', 'most', 'much', 'must',
  'my', 'never', 'now', 'of', 'on', 'only', 'or', 'other', 'our', 'out', 'over',
  'said', 'same', 'see', 'should', 'since', 'some', 'still', 'such', 'take', 'than',
  'that', 'the', 'their', 'them', 'then', 'there', 'these', 'they', 'this', 'those',
  'through', 'to', 'too', 'under', 'up', 'very', 'was', 'way', 'we', 'well', 'were',
	'what', 'where', 'which', 'while', 'who', 'with', 'would', 'you', 'your', 'a', 'i'
];

const mecab = new MeCab();

function tokenize(text: string) {
	if (text == null) return [];

	// パース
	const ast = parse(text);

	const plain = ast
		// テキストのみ(URLなどを除外するという意)
		.filter(t => t.type == 'text' || t.type == 'bold')
		.map(t => t.content)
		.join('');

	const tokens = mecab.parseSync(plain)
		// キーワードのみ
		.filter(token => token[1] == '名詞' && (token[2] == '固有名詞' || token[2] == '一般'))
		// 取り出し
		.map(token => token[0].toLowerCase())
		// ストップワード
		.filter(word => stopwords.indexOf(word) === -1 && word.length > 1);

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
	process.stdout.write(`extracting keywords of ${id} ...`);

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
		limit: 10000,
		fields: {
			_id: false,
			text: true
		}
	});

	// 投稿が少なかったら中断
	if (recentPosts.length < 300) {
		process.stdout.write(' >>> -\n');
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

	process.stdout.write(' >>> ' + topKeywords.join(', ') + '\n');

	// Save
	User.update({ _id: id }, {
		$set: {
			keywords: topKeywords
		}
	}).then(() => {
		cb();
	});
}
