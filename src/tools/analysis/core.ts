const bayes = require('./naive-bayes.js');

const MeCab = require('./mecab');
import Post from '../../server/api/models/post';

/**
 * 投稿を学習したり与えられた投稿のカテゴリを予測します
 */
export default class Categorizer {
	private classifier: any;
	private mecab: any;

	constructor() {
		this.mecab = new MeCab();

		// BIND -----------------------------------
		this.tokenizer = this.tokenizer.bind(this);
	}

	private tokenizer(text: string) {
		const tokens = this.mecab.parseSync(text)
			// 名詞だけに制限
			.filter(token => token[1] === '名詞')
			// 取り出し
			.map(token => token[0]);

		return tokens;
	}

	public async init() {
		this.classifier = bayes({
			tokenizer: this.tokenizer
		});

		// 訓練データ取得
		const verifiedPosts = await Post.find({
			is_category_verified: true
		});

		// 学習
		verifiedPosts.forEach(post => {
			this.classifier.learn(post.text, post.category);
		});
	}

	public async predict(text) {
		return this.classifier.categorize(text);
	}
}
