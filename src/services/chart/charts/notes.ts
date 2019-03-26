import autobind from 'autobind-decorator';
import Chart, { Obj } from '../core';
import { SchemaType } from '../../../misc/schema';
import { Notes } from '../../../models';
import { Not } from 'typeorm';
import { Note } from '../../../models/entities/note';

const logSchema = {
	total: {
		type: 'number' as 'number',
		description: '集計期間時点での、全投稿数'
	},

	inc: {
		type: 'number' as 'number',
		description: '増加した投稿数'
	},

	dec: {
		type: 'number' as 'number',
		description: '減少した投稿数'
	},

	diffs: {
		type: 'object' as 'object',
		properties: {
			normal: {
				type: 'number' as 'number',
				description: '通常の投稿数の差分'
			},

			reply: {
				type: 'number' as 'number',
				description: 'リプライの投稿数の差分'
			},

			renote: {
				type: 'number' as 'number',
				description: 'Renoteの投稿数の差分'
			},
		}
	},
};

export const notesLogSchema = {
	type: 'object' as 'object',
	properties: {
		local: {
			type: 'object' as 'object',
			properties: logSchema
		},
		remote: {
			type: 'object' as 'object',
			properties: logSchema
		},
	}
};

type NotesLog = SchemaType<typeof notesLogSchema>;

export default class NotesChart extends Chart<NotesLog> {
	constructor() {
		super('notes', notesLogSchema);
	}

	@autobind
	protected async getTemplate(init: boolean, latest?: NotesLog): Promise<NotesLog> {
		const [localCount, remoteCount] = init ? await Promise.all([
			Notes.count({ userHost: null }),
			Notes.count({ userHost: Not(null) })
		]) : [
			latest ? latest.local.total : 0,
			latest ? latest.remote.total : 0
		];

		return {
			local: {
				total: localCount,
				inc: 0,
				dec: 0,
				diffs: {
					normal: 0,
					reply: 0,
					renote: 0
				}
			},
			remote: {
				total: remoteCount,
				inc: 0,
				dec: 0,
				diffs: {
					normal: 0,
					reply: 0,
					renote: 0
				}
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
