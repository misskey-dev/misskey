import autobind from 'autobind-decorator';
import Chart, { Obj } from './';
import User, { IUser, isLocalUser } from '../../models/user';
import { SchemaType } from '../../prelude/schema';

const logSchema = {
	/**
	 * 集計期間時点での、全ユーザー数
	 */
	total: {
		type: 'number' as 'number',
		description: '集計期間時点での、全ユーザー数'
	},

	/**
	 * 増加したユーザー数
	 */
	inc: {
		type: 'number' as 'number',
		description: '増加したユーザー数'
	},

	/**
	 * 減少したユーザー数
	 */
	dec: {
		type: 'number' as 'number',
		description: '減少したユーザー数'
	},
};

export const usersLogSchema = {
	type: 'object' as 'object',
	properties: {
		local: {
			type: 'object' as 'object',
			properties: logSchema
		},
		remote: {
			type: 'object' as 'object',
			properties: logSchema
		},
	}
};

type UsersLog = SchemaType<typeof usersLogSchema>;

class UsersChart extends Chart<UsersLog> {
	constructor() {
		super('users');
	}

	@autobind
	protected async getTemplate(init: boolean, latest?: UsersLog): Promise<UsersLog> {
		const [localCount, remoteCount] = init ? await Promise.all([
			User.count({ host: null }),
			User.count({ host: { $ne: null } })
		]) : [
			latest ? latest.local.total : 0,
			latest ? latest.remote.total : 0
		];

		return {
			local: {
				total: localCount,
				inc: 0,
				dec: 0
			},
			remote: {
				total: remoteCount,
				inc: 0,
				dec: 0
			}
		};
	}

	@autobind
	public async update(user: IUser, isAdditional: boolean) {
		const update: Obj = {};

		update.total = isAdditional ? 1 : -1;
		if (isAdditional) {
			update.inc = 1;
		} else {
			update.dec = 1;
		}

		await this.inc({
			[isLocalUser(user) ? 'local' : 'remote']: update
		});
	}
}

export default new UsersChart();
