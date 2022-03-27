import Chart, { KVs } from '../core.js';
import { User } from '@/models/entities/user.js';
import { Notes } from '@/models/index.js';
import { Note } from '@/models/entities/note.js';
import { name, schema } from './entities/per-user-notes.js';

/**
 * ユーザーごとのノートに関するチャート
 */
// eslint-disable-next-line import/no-default-export
export default class PerUserNotesChart extends Chart<typeof schema> {
	constructor() {
		super(name, schema, true);
	}

	protected async tickMajor(group: string): Promise<Partial<KVs<typeof schema>>> {
		const [count] = await Promise.all([
			Notes.countBy({ userId: group }),
		]);

		return {
			total: count,
		};
	}

	protected async tickMinor(): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	public async update(user: { id: User['id'] }, note: Note, isAdditional: boolean): Promise<void> {
		await this.commit({
			'total': isAdditional ? 1 : -1,
			'inc': isAdditional ? 1 : 0,
			'dec': isAdditional ? 0 : 1,
			'diffs.normal': note.replyId == null && note.renoteId == null ? (isAdditional ? 1 : -1) : 0,
			'diffs.renote': note.renoteId != null ? (isAdditional ? 1 : -1) : 0,
			'diffs.reply': note.replyId != null ? (isAdditional ? 1 : -1) : 0,
			'diffs.withFile': note.fileIds.length > 0 ? (isAdditional ? 1 : -1) : 0,
		}, user.id);
	}
}
