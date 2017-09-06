import * as fs from 'fs';
const bayes = require('bayes');
const MeCab = require('mecab-async');
import Post from '../../api/models/post';

export default class Categorizer {
	classifier: any;
	categorizerDbFilePath: string;
	mecab: any;

	constructor(categorizerDbFilePath: string, mecabCommand: string = 'mecab -d /usr/share/mecab/dic/mecab-ipadic-neologd') {
		this.categorizerDbFilePath = categorizerDbFilePath;

		this.mecab = new MeCab();
		this.mecab.command = mecabCommand;

		// BIND -----------------------------------
		this.tokenizer = this.tokenizer.bind(this);
	}

	tokenizer(text: string) {
		return this.mecab.wakachiSync(text);
	}

	async init() {
		try {
			const db = fs.readFileSync(this.categorizerDbFilePath, {
				encoding: 'utf8'
			});

			this.classifier = bayes.fromJson(db);
			this.classifier.tokenizer = this.tokenizer;
		} catch(e) {
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

	async learn(id, category) {
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

	async categorize(id) {
		const post = await Post.findOne({ _id: id });

		const category = this.classifier.categorize(post.text);

		Post.update({ _id: id }, {
			$set: {
				category: category
			}
		});
	}

	async test(text) {
		return this.classifier.categorize(text);
	}

	save() {
		fs.writeFileSync(this.categorizerDbFilePath, this.classifier.toJson(), {
			encoding: 'utf8'
		});
	}
}

