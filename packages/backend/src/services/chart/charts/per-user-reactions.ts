import Chart, { KVs } from '../core.js';
import { User } from '@/models/entities/user.js';
import { Note } from '@/models/entities/note.js';
import { Users } from '@/models/index.js';
import { name, schema } from './entities/per-user-reactions.js';

/**
 * ユーザーごとのリアクションに関するチャート
 */
// eslint-disable-next-line import/no-default-export
export default class PerUserReactionsChart extends Chart<typeof schema> {
	constructor() {
		super(name, schema, true);
	}

	protected async tickMajor(group: string): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	protected async tickMinor(): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	public async update(user: { id: User['id'], host: User['host'] }, note: Note): Promise<void> {
		const prefix = Users.isLocalUser(user) ? 'local' : 'remote';
		this.commit({
			[`${prefix}.count`]: 1,
		}, note.userId);
	}
}
