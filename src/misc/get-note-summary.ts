/**
 * 投稿を表す文字列を取得します。
 * @param {*} note (packされた)投稿
 */
const summarize = (note: any, locale: any): string => {
	if (note.deletedAt) {
		return `(${locale['deletedNote']})`;
	}

	if (note.isHidden) {
		return `(${locale['invisibleNote']})`;
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
		summary += ` (${locale['withNFiles'].replace('{n}', note.files.length)})`;
	}

	// 投票が添付されているとき
	if (note.poll) {
		summary += ` (${locale._cw?.poll || locale['_cw.poll']})`;
	}

	// 返信のとき
	if (note.replyId) {
		if (note.reply) {
			summary += `\n\nRE: ${summarize(note.reply, locale)}`;
		} else {
			summary += '\n\nRE: ...';
		}
	}

	// Renoteのとき
	if (note.renoteId) {
		if (note.renote) {
			summary += `\n\nRN: ${summarize(note.renote, locale)}`;
		} else {
			summary += '\n\nRN: ...';
		}
	}

	return summary.trim();
};

export default summarize;
