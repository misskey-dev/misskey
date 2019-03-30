import autobind from 'autobind-decorator';
import Chart from '../../core';
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
	protected async getTemplate(init: boolean, latest?: PerUserReactionsLog, group?: string): Promise<PerUserReactionsLog> {
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
	public async update(user: User, note: Note) {
		this.inc({
			[Users.isLocalUser(user) ? 'local' : 'remote']: { count: 1 }
		}, note.userId);
	}
}
