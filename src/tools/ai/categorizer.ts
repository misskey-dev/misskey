import * as fs from 'fs';

const bayes = require('./naive-bayes.js');
const MeCab = require('mecab-async');
import * as msgpack from 'msgpack-lite';

import Post from '../../api/models/post';
import config from '../../conf';

/**
 * 投稿を学習したり与えられた投稿のカテゴリを予測します
 */
export default class Categorizer {
	private classifier: any;
	private categorizerDbFilePath: string;
	private mecab: any;

	constructor() {
		this.categorizerDbFilePath = `${__dirname}/../../../data/category`;

		this.mecab = new MeCab();
		if (config.categorizer.mecab_command) this.mecab.command = config.categorizer.mecab_command;

		// BIND -----------------------------------
		this.tokenizer = this.tokenizer.bind(this);
	}

	private tokenizer(text: string) {
		return this.mecab.wakachiSync(text);
	}

	public async init() {
		try {
			const buffer = fs.readFileSync(this.categorizerDbFilePath);
			const db = msgpack.decode(buffer);

			this.classifier = bayes.import(db);
			this.classifier.tokenizer = this.tokenizer;
		} catch (e) {
			this.classifier = bayes({
				tokenizer: this.tokenizer
			});

			// 訓練データ
			const verifiedPosts = await Post.find({
				is_category_verified: true
			});

			// 学習
			verifiedPosts.forEach(post => {
				this.classifier.learn(post.text, post.category);
			});

			this.save();
		}
	}

	public async learn(id, category) {
		const post = await Post.findOne({ _id: id });

		Post.update({ _id: id }, {
			$set: {
				category: category,
				is_category_verified: true
			}
		});

		this.classifier.learn(post.text, category);

		this.save();
	}

	public async categorize(id) {
		const post = await Post.findOne({ _id: id });

		const category = this.classifier.categorize(post.text);

		Post.update({ _id: id }, {
			$set: {
				category: category
			}
		});
	}

	public async test(text) {
		return this.classifier.categorize(text);
	}

	private save() {
		const buffer = msgpack.encode(this.classifier.export());
		fs.writeFileSync(this.categorizerDbFilePath, buffer);
	}
}
