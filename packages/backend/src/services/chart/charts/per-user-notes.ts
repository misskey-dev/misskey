import autobind from 'autobind-decorator';
import Chart, { KVs } from '../core';
import { User } from '@/models/entities/user';
import { Notes } from '@/models/index';
import { Note } from '@/models/entities/note';
import { name, schema } from './entities/per-user-notes';

/**
 * ユーザーごとのノートに関するチャート
 */
// eslint-disable-next-line import/no-default-export
export default class PerUserNotesChart extends Chart<typeof schema> {
	constructor() {
		super(name, schema, true);
	}

	@autobind
	protected async queryCurrentState(group: string): Promise<Partial<KVs<typeof schema>>> {
		const [count] = await Promise.all([
			Notes.count({ userId: group }),
		]);

		return {
			total: count,
		};
	}

	@autobind
	public async update(user: { id: User['id'] }, note: Note, isAdditional: boolean): Promise<void> {
		const update: Obj = {
			diffs: {},
		};

		update.total = isAdditional ? 1 : -1;

		if (isAdditional) {
			update.inc = 1;
		} else {
			update.dec = 1;
		}

		if (note.replyId != null) {
			update.diffs.reply = isAdditional ? 1 : -1;
		} else if (note.renoteId != null) {
			update.diffs.renote = isAdditional ? 1 : -1;
		} else {
			update.diffs.normal = isAdditional ? 1 : -1;
		}

		await this.inc(update, user.id);
	}
}
