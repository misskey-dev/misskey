import Chart, { KVs } from '../core.js';
import { Notes } from '@/models/index.js';
import { Not, IsNull } from 'typeorm';
import { Note } from '@/models/entities/note.js';
import { name, schema } from './entities/notes.js';

/**
 * ノートに関するチャート
 */
// eslint-disable-next-line import/no-default-export
export default class NotesChart extends Chart<typeof schema> {
	constructor() {
		super(name, schema);
	}

	protected async tickMajor(): Promise<Partial<KVs<typeof schema>>> {
		const [localCount, remoteCount] = await Promise.all([
			Notes.countBy({ userHost: IsNull() }),
			Notes.countBy({ userHost: Not(IsNull()) }),
		]);

		return {
			'local.total': localCount,
			'remote.total': remoteCount,
		};
	}

	protected async tickMinor(): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	public async update(note: Note, isAdditional: boolean): Promise<void> {
		const prefix = note.userHost === null ? 'local' : 'remote';

		await this.commit({
			[`${prefix}.total`]: isAdditional ? 1 : -1,
			[`${prefix}.inc`]: isAdditional ? 1 : 0,
			[`${prefix}.dec`]: isAdditional ? 0 : 1,
			[`${prefix}.diffs.normal`]: note.replyId == null && note.renoteId == null ? (isAdditional ? 1 : -1) : 0,
			[`${prefix}.diffs.renote`]: note.renoteId != null ? (isAdditional ? 1 : -1) : 0,
			[`${prefix}.diffs.reply`]: note.replyId != null ? (isAdditional ? 1 : -1) : 0,
			[`${prefix}.diffs.withFile`]: note.fileIds.length > 0 ? (isAdditional ? 1 : -1) : 0,
		});
	}
}
