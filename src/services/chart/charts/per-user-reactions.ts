import autobind from 'autobind-decorator';
import Chart from '../core';
import { User, isLocalUser } from '../../../models/entities/user';
import { Note } from '../../../models/entities/note';

/**
 * ユーザーごとのリアクションに関するチャート
 */
type PerUserReactionsLog = {
	local: {
		/**
		 * リアクションされた数
		 */
		count: number;
	};

	remote: PerUserReactionsLog['local'];
};

class PerUserReactionsChart extends Chart<PerUserReactionsLog> {
	constructor() {
		super('perUserReaction', true);
	}

	@autobind
	protected async getTemplate(init: boolean, latest?: PerUserReactionsLog, group?: any): Promise<PerUserReactionsLog> {
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
	public async update(user: User, note: Note) {
		this.inc({
			[isLocalUser(user) ? 'local' : 'remote']: { count: 1 }
		}, note.userId);
	}
}

export default new PerUserReactionsChart();
