import autobind from 'autobind-decorator';
import Chart, { DeepPartial } from '../../core';
import { User } from '../../../../models/entities/user';
import { Note } from '../../../../models/entities/note';
import { SchemaType } from '../../../../misc/schema';
import { Users } from '../../../../models';
import { name, schema } from '../schemas/per-user-reactions';

type PerUserReactionsLog = SchemaType<typeof schema>;

export default class PerUserReactionsChart extends Chart<PerUserReactionsLog> {
	constructor() {
		super(name, schema, true);
	}

	@autobind
	public async update(user: User, note: Note) {
		this.inc({
			[Users.isLocalUser(user) ? 'local' : 'remote']: { count: 1 }
		}, note.userId);
	}

	@autobind
	protected genNewLog(latest: PerUserReactionsLog): DeepPartial<PerUserReactionsLog> {
		return {};
	}

	@autobind
	protected async fetchActual(group: string): Promise<DeepPartial<PerUserReactionsLog>> {
		return {};
	}
}
