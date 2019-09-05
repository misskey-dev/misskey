import autobind from 'autobind-decorator';
import Chart, { DeepPartial, Obj } from '../../core';
import { User } from '../../../../models/entities/user';
import { SchemaType } from '../../../../misc/schema';
import { Users } from '../../../../models';
import { name, schema } from '../schemas/active-users';

type ActiveUsersLog = SchemaType<typeof schema>;

export default class ActiveUsersChart extends Chart<ActiveUsersLog> {
	constructor() {
		super(name, schema);
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

	@autobind
	protected genNewLog(latest: ActiveUsersLog): DeepPartial<ActiveUsersLog> {
		return {};
	}

	@autobind
	protected async fetchActual(): Promise<DeepPartial<ActiveUsersLog>> {
		return {};
	}
}
