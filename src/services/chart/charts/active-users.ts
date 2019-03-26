import autobind from 'autobind-decorator';
import Chart, { Obj } from '../core';
import { User } from '../../../models/entities/user';
import { SchemaType } from '../../../misc/schema';
import { Users } from '../../../models';

/**
 * アクティブユーザーに関するチャート
 */
export const logSchema = {
	/**
	 * アクティブユーザー数
	 */
	count: {
		type: 'number',
		description: 'アクティブユーザー数',
	},
};

export const activeUsersLogSchema = {
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

type ActiveUsersLog = SchemaType<typeof activeUsersLogSchema>;

export default class ActiveUsersChart extends Chart<ActiveUsersLog> {
	constructor() {
		super('activeUsers', activeUsersLogSchema);
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
	public async update(user: User) {
		const update: Obj = {
			count: 1
		};

		await this.incIfUnique({
			[Users.isLocalUser(user) ? 'local' : 'remote']: update
		}, 'users', user.id);
	}
}
