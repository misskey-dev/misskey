import autobind from 'autobind-decorator';
import Chart, { KVs } from '../core';
import { Notes } from '@/models/index';
import { Not, IsNull } from 'typeorm';
import { Note } from '@/models/entities/note';
import { name, schema } from './entities/notes';

/**
 * ノートに関するチャート
 */
// eslint-disable-next-line import/no-default-export
export default class NotesChart extends Chart<typeof schema> {
	constructor() {
		super(name, schema);
	}

	@autobind
	protected async queryCurrentState(): Promise<Partial<KVs<typeof schema>>> {
		const [localCount, remoteCount] = await Promise.all([
			Notes.count({ userHost: null }),
			Notes.count({ userHost: Not(IsNull()) }),
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
	public async update(note: Note, isAdditional: boolean): Promise<void> {
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

		await this.inc({
			[note.userHost === null ? 'local' : 'remote']: update,
		});
	}
}
