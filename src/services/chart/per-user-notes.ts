import autobind from 'autobind-decorator';
import Chart, { Obj } from './';
import Note, { INote } from '../../models/note';
import { IUser } from '../../models/user';
import { SchemaType } from '../../prelude/schema';

export const perUserNotesLogSchema = {
	type: 'object' as 'object',
	properties: {
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
	}
};

type PerUserNotesLog = SchemaType<typeof perUserNotesLogSchema>;

class PerUserNotesChart extends Chart<PerUserNotesLog> {
	constructor() {
		super('perUserNotes', true);
	}

	@autobind
	protected async getTemplate(init: boolean, latest?: PerUserNotesLog, group?: any): Promise<PerUserNotesLog> {
		const [count] = init ? await Promise.all([
			Note.count({ userId: group, deletedAt: null }),
		]) : [
			latest ? latest.total : 0
		];

		return {
			total: count,
			inc: 0,
			dec: 0,
			diffs: {
				normal: 0,
				reply: 0,
				renote: 0
			}
		};
	}

	@autobind
	public async update(user: IUser, note: INote, isAdditional: boolean) {
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

		await this.inc(update, user._id);
	}
}

export default new PerUserNotesChart();
