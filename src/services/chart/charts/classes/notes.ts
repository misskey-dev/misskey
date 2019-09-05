import autobind from 'autobind-decorator';
import Chart, { DeepPartial, Obj } from '../../core';
import { SchemaType } from '../../../../misc/schema';
import { Notes } from '../../../../models';
import { IsNull, Not } from 'typeorm';
import { Note } from '../../../../models/entities/note';
import { name, schema } from '../schemas/notes';

type NotesLog = SchemaType<typeof schema>;

export default class NotesChart extends Chart<NotesLog> {
	constructor() {
		super(name, schema);
	}

	@autobind
	public async update(note: Note, isAdditional: boolean) {
		const update: Obj = {
			diffs: {}
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
			[note.userHost === null ? 'local' : 'remote']: update
		});
	}

	@autobind
	protected genNewLog(latest: NotesLog): DeepPartial<NotesLog> {
		return {
			local: {
				total: latest.local.total,
			},
			remote: {
				total: latest.remote.total,
			}
		};
	}

	@autobind
	protected async fetchActual(): Promise<DeepPartial<NotesLog>> {
		const [localCount, remoteCount] = await Promise.all([
			Notes.count({ userHost: null }),
			Notes.count({ userHost: Not(IsNull()) })
		]);

		return {
			local: {
				total: localCount,
			},
			remote: {
				total: remoteCount,
			}
		};
	}
}
