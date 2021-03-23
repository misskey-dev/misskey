import autobind from 'autobind-decorator';
import Chart, { DeepPartial } from '../../core';
import { User } from '../../../../models/entities/user';
import { Note } from '../../../../models/entities/note';
import { SchemaType } from '@/misc/schema';
import { Users } from '../../../../models';
import { name, schema } from '../schemas/per-user-reactions';

type PerUserReactionsLog = SchemaType<typeof schema>;

export default class PerUserReactionsChart extends Chart<PerUserReactionsLog> {
	constructor() {
		super(name, schema, true);
	}

	@autobind
	protected genNewLog(latest: PerUserReactionsLog): DeepPartial<PerUserReactionsLog> {
		return {};
	}

	@autobind
	protected aggregate(logs: PerUserReactionsLog[]): PerUserReactionsLog {
		return {
			local: {
				count: logs.reduce((a, b) => a + b.local.count, 0),
			},
			remote: {
				count: logs.reduce((a, b) => a + b.remote.count, 0),
			},
		};
	}

	@autobind
	protected async fetchActual(group: string): Promise<DeepPartial<PerUserReactionsLog>> {
		return {};
	}

	@autobind
	public async update(user: User, note: Note) {
		this.inc({
			[Users.isLocalUser(user) ? 'local' : 'remote']: { count: 1 }
		}, note.userId);
	}
}
