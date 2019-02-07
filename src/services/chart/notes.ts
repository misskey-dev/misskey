import autobind from 'autobind-decorator';
import Chart, { Obj } from '.';
import Note, { INote } from '../../models/note';
import { isLocalUser } from '../../models/user';

/**
 * 投稿に関するチャート
 */
type NotesLog = {
	local: {
		/**
		 * 集計期間時点での、全投稿数
		 */
		total: number;

		/**
		 * 増加した投稿数
		 */
		inc: number;

		/**
		 * 減少した投稿数
		 */
		dec: number;

		diffs: {
			/**
			 * 通常の投稿数の差分
			 */
			normal: number;

			/**
			 * リプライの投稿数の差分
			 */
			reply: number;

			/**
			 * Renoteの投稿数の差分
			 */
			renote: number;
		};
	};

	remote: NotesLog['local'];
};

class NotesChart extends Chart<NotesLog> {
	constructor() {
		super('notes');
	}

	@autobind
	protected async getTemplate(init: boolean, latest?: NotesLog): Promise<NotesLog> {
		const [localCount, remoteCount] = init ? await Promise.all([
			Note.count({ '_user.host': null }),
			Note.count({ '_user.host': { $ne: null } })
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
	public async update(note: INote, isAdditional: boolean) {
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
			[isLocalUser(note._user) ? 'local' : 'remote']: update
		});
	}
}

export default new NotesChart();
