import * as misskey from 'misskey-js';
import { I18n } from '@/scripts/i18n';

/**
 * 投稿を表す文字列を取得します。
 * @param {*} note (packされた)投稿
 */
export const getNoteSummary = (note: misskey.entities.Note, i18n: I18n<any>): string => {
	if (note.deletedAt) {
		return `(${i18n.locale.deletedNote})`;
	}

	if (note.isHidden) {
		return `(${i18n.locale.invisibleNote})`;
	}

	let summary = '';

	// 本文
	if (note.cw != null) {
		summary += note.cw;
	} else {
		summary += note.text ? note.text : '';
	}

	// ファイルが添付されているとき
	if ((note.files || []).length != 0) {
		summary += ` (${i18n.t('withNFiles', { n: note.files.length })})`;
	}

	// 投票が添付されているとき
	if (note.poll) {
		summary += ` (${i18n.locale.poll})`;
	}

	// 返信のとき
	if (note.replyId) {
		if (note.reply) {
			summary += `\n\nRE: ${getNoteSummary(note.reply, i18n)}`;
		} else {
			summary += '\n\nRE: ...';
		}
	}

	// Renoteのとき
	if (note.renoteId) {
		if (note.renote) {
			summary += `\n\nRN: ${getNoteSummary(note.renote, i18n)}`;
		} else {
			summary += '\n\nRN: ...';
		}
	}

	return summary.trim();
};
