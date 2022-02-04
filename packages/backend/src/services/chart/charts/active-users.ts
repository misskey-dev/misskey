import autobind from 'autobind-decorator';
import Chart, { DeepPartial, KVs } from '../core';
import { User } from '@/models/entities/user';
import { Users } from '@/models/index';
import { name, schema } from './entities/active-users';

/**
 * アクティブユーザーに関するチャート
 */
// eslint-disable-next-line import/no-default-export
export default class ActiveUsersChart extends Chart<typeof schema> {
	constructor() {
		super(name, schema);
	}

	@autobind
	protected aggregate(logs: ActiveUsersLog[]): ActiveUsersLog {
		return {
			local: {
				users: logs.reduce((a, b) => a.concat(b.local.users), [] as ActiveUsersLog['local']['users']),
			},
			remote: {
				users: logs.reduce((a, b) => a.concat(b.remote.users), [] as ActiveUsersLog['remote']['users']),
			},
		};
	}

	@autobind
	protected async fetchActual(): Promise<DeepPartial<KVs<typeof schema>>> {
		return {};
	}

	@autobind
	public async update(user: { id: User['id'], host: User['host'] }): Promise<void> {
		await this.commit({
			'local.users': Users.isLocalUser(user) ? [user.id] : [],
			'remote.users': Users.isLocalUser(user) ? [] : [user.id],
		});
	}
}
