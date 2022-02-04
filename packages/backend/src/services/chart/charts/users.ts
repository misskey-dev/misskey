import autobind from 'autobind-decorator';
import Chart, { KVs } from '../core';
import { Users } from '@/models/index';
import { Not, IsNull } from 'typeorm';
import { User } from '@/models/entities/user';
import { name, schema } from './entities/users';

/**
 * ユーザー数に関するチャート
 */
// eslint-disable-next-line import/no-default-export
export default class UsersChart extends Chart<typeof schema> {
	constructor() {
		super(name, schema);
	}

	@autobind
	protected async queryCurrentState(): Promise<Partial<KVs<typeof schema>>> {
		const [localCount, remoteCount] = await Promise.all([
			Users.count({ host: null }),
			Users.count({ host: Not(IsNull()) }),
		]);

		return {
			local: {
				total: localCount,
			},
			remote: {
				total: remoteCount,
			},
		};
	}

	@autobind
	public async update(user: { id: User['id'], host: User['host'] }, isAdditional: boolean): Promise<void> {
		const update: Obj = {};

		update.total = isAdditional ? 1 : -1;
		if (isAdditional) {
			update.inc = 1;
		} else {
			update.dec = 1;
		}

		await this.inc({
			[Users.isLocalUser(user) ? 'local' : 'remote']: update,
		});
	}
}
