import autobind from 'autobind-decorator';
import Chart, { Obj } from '.';
import { IUser, isLocalUser } from '../../models/user';

/**
 * アクティブユーザーに関するチャート
 */
type ActiveUsersLog = {
	local: {
		/**
		 * アクティブユーザー数
		 */
		count: number;
	};

	remote: ActiveUsersLog['local'];
};

class ActiveUsersChart extends Chart<ActiveUsersLog> {
	constructor() {
		super('activeUsers');
	}

	@autobind
	protected async getTemplate(init: boolean, latest?: ActiveUsersLog): Promise<ActiveUsersLog> {
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
	public async update(user: IUser) {
		const update: Obj = {
			count: 1
		};

		await this.incIfUnique({
			[isLocalUser(user) ? 'local' : 'remote']: update
		}, 'users', user._id.toHexString());
	}
}

export default new ActiveUsersChart();
