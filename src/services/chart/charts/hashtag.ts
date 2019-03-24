import autobind from 'autobind-decorator';
import Chart, { Obj } from '../core';
import { User, isLocalUser } from '../../../models/entities/user';

/**
 * ハッシュタグに関するチャート
 */
type HashtagLog = {
	local: {
		/**
		 * 投稿された数
		 */
		count: number;
	};

	remote: HashtagLog['local'];
};

class HashtagChart extends Chart<HashtagLog> {
	constructor() {
		super('hashtag', true);
	}

	@autobind
	protected async getTemplate(init: boolean, latest?: HashtagLog): Promise<HashtagLog> {
		return {
			local: {
				count: 0
			},
			remote: {
				count: 0
			}
		};
	}

	@autobind
	public async update(hashtag: string, user: User) {
		const update: Obj = {
			count: 1
		};

		await this.incIfUnique({
			[isLocalUser(user) ? 'local' : 'remote']: update
		}, 'users', user.id, hashtag);
	}
}

export default new HashtagChart();
