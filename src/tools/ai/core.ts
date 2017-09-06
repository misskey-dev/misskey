const bayes = require('./naive-bayes.js');
const MeCab = require('mecab-async');

import Post from '../../api/models/post';
import config from '../../conf';

/**
 * 投稿を学習したり与えられた投稿のカテゴリを予測します
 */
export default class Categorizer {
	private classifier: any;
	private mecab: any;

	constructor() {
		this.mecab = new MeCab();
		if (config.categorizer.mecab_command) this.mecab.command = config.categorizer.mecab_command;

		// BIND -----------------------------------
		this.tokenizer = this.tokenizer.bind(this);
	}

	private tokenizer(text: string) {
		return this.mecab.wakachiSync(text);
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
