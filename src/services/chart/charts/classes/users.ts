import autobind from 'autobind-decorator';
import Chart, { DeepPartial, Obj } from '../../core';
import { SchemaType } from '../../../../misc/schema';
import { Users } from '../../../../models';
import { IsNull, Not } from 'typeorm';
import { User } from '../../../../models/entities/user';
import { name, schema } from '../schemas/users';

type UsersLog = SchemaType<typeof schema>;

export default class UsersChart extends Chart<UsersLog> {
	constructor() {
		super(name, schema);
	}

	@autobind
	public async update(user: User, isAdditional: boolean) {
		const update: Obj = {};

		update.total = isAdditional ? 1 : -1;
		if (isAdditional) {
			update.inc = 1;
		} else {
			update.dec = 1;
		}

		await this.inc({
			[Users.isLocalUser(user) ? 'local' : 'remote']: update
		});
	}

	@autobind
	protected genNewLog(latest: UsersLog): DeepPartial<UsersLog> {
		return {
			local: {
				total: latest.local.total,
			},
			remote: {
				total: latest.remote.total,
			}
		};
	}

	@autobind
	protected async fetchActual(): Promise<DeepPartial<UsersLog>> {
		const [localCount, remoteCount] = await Promise.all([
			Users.count({ host: null }),
			Users.count({ host: Not(IsNull()) })
		]);

		return {
			local: {
				total: localCount,
			},
			remote: {
				total: remoteCount,
			}
		};
	}
}
