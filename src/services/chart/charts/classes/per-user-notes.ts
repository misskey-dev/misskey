import autobind from 'autobind-decorator';
import Chart, { Obj } from '../../core';
import { User } from '../../../../models/entities/user';
import { SchemaType } from '../../../../misc/schema';
import { Notes } from '../../../../models';
import { Note } from '../../../../models/entities/note';
import { name, schema } from '../schemas/per-user-notes';

type PerUserNotesLog = SchemaType<typeof schema>;

export default class PerUserNotesChart extends Chart<PerUserNotesLog> {
	constructor() {
		super(name, schema, true);
	}

	@autobind
	protected async getTemplate(init: boolean, latest?: PerUserNotesLog, group?: string): Promise<PerUserNotesLog> {
		const [count] = init ? await Promise.all([
			Notes.count({ userId: group }),
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
	public async update(user: User, note: Note, isAdditional: boolean) {
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

		await this.inc(update, user.id);
	}
}
