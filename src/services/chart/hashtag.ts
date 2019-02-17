import autobind from 'autobind-decorator';
import Chart, { Obj } from './';
import { IUser, isLocalUser } from '../../models/user';
import db from '../../db/mongodb';

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

		// 後方互換性のため
		db.get('chart.hashtag').findOne().then(doc => {
			if (doc != null && doc.data.local == null) {
				db.get('chart.hashtag').drop();
			}
		});
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
	public async update(hashtag: string, user: IUser) {
		const update: Obj = {
			count: 1
		};

		await this.incIfUnique({
			[isLocalUser(user) ? 'local' : 'remote']: update
		}, 'users', user._id.toHexString(), hashtag);
	}
}

export default new HashtagChart();
