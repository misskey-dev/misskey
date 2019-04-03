import autobind from 'autobind-decorator';
import Chart, { Obj, DeepPartial } from '../../core';
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
	protected genNewLog(latest: ActiveUsersLog): DeepPartial<ActiveUsersLog> {
		return {};
	}

	@autobind
	protected async fetchActual(): Promise<DeepPartial<ActiveUsersLog>> {
		return {};
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
