import autobind from 'autobind-decorator';
import * as mongo from 'mongodb';
import Chart, { Partial } from './';

/**
 * ハッシュタグに関するチャート
 */
type HashtagLog = {
	/**
	 * 投稿された数
	 */
	count: number;
};

class HashtagChart extends Chart<HashtagLog> {
	constructor() {
		super('hashtag', true);
	}

	@autobind
	protected async getTemplate(init: boolean, latest?: HashtagLog): Promise<HashtagLog> {
		return {
			count: 0
		};
	}

	@autobind
	public async update(hashtag: string, userId: mongo.ObjectId) {
		const inc: Partial<HashtagLog> = {
			count: 1
		};

		await this.incIfUnique(inc, 'users', userId.toHexString(), hashtag);
	}
}

export default new HashtagChart();
