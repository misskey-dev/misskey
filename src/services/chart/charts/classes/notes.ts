import autobind from 'autobind-decorator';
import Chart, { Obj, DeepPartial } from '../../core';
import { SchemaType } from '@/misc/schema';
import { Notes } from '@/models/index';
import { Not, IsNull } from 'typeorm';
import { Note } from '@/models/entities/note';
import { name, schema } from '../schemas/notes';

type NotesLog = SchemaType<typeof schema>;

export default class NotesChart extends Chart<NotesLog> {
	constructor() {
		super(name, schema);
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
	protected aggregate(logs: NotesLog[]): NotesLog {
		return {
			local: {
				total: logs[0].local.total,
				inc: logs.reduce((a, b) => a + b.local.inc, 0),
				dec: logs.reduce((a, b) => a + b.local.dec, 0),
				diffs: {
					reply: logs.reduce((a, b) => a + b.local.diffs.reply, 0),
					renote: logs.reduce((a, b) => a + b.local.diffs.renote, 0),
					normal: logs.reduce((a, b) => a + b.local.diffs.normal, 0),
				},
			},
			remote: {
				total: logs[0].remote.total,
				inc: logs.reduce((a, b) => a + b.remote.inc, 0),
				dec: logs.reduce((a, b) => a + b.remote.dec, 0),
				diffs: {
					reply: logs.reduce((a, b) => a + b.remote.diffs.reply, 0),
					renote: logs.reduce((a, b) => a + b.remote.diffs.renote, 0),
					normal: logs.reduce((a, b) => a + b.remote.diffs.normal, 0),
				},
			},
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
}
