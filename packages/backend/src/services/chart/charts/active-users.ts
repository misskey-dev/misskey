import autobind from 'autobind-decorator';
import Chart, { Obj, DeepPartial } from '../core';
import { User } from '@/models/entities/user';
import { SchemaType } from '@/misc/schema';
import { Users } from '@/models/index';
import { name, schema } from './entities/active-users';

type ActiveUsersLog = SchemaType<typeof schema>;

/**
 * アクティブユーザーに関するチャート
 */
// eslint-disable-next-line import/no-default-export
export default class ActiveUsersChart extends Chart<ActiveUsersLog> {
	constructor() {
		super(name, schema);
	}

	@autobind
	protected genNewLog(latest: ActiveUsersLog): DeepPartial<ActiveUsersLog> {
		return {};
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
	protected async fetchActual(): Promise<DeepPartial<ActiveUsersLog>> {
		return {};
	}

	@autobind
	public async update(user: { id: User['id'], host: User['host'] }): Promise<void> {
		const update: Obj = {
			users: [user.id],
		};

		await this.inc({
			[Users.isLocalUser(user) ? 'local' : 'remote']: update,
		});
	}
}
