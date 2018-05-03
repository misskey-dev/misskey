/**
 * 投稿を表す文字列を取得します。
 * @param {*} note 投稿
 */
const summarize = (note: any): string => {
	if (note.isHidden) {
		return '(非公開の投稿)';
	}

	let summary = '';

	// チャンネル
	summary += note.channel ? `${note.channel.title}:` : '';

	// 本文
	summary += note.text ? note.text : '';

	// メディアが添付されているとき
	if (note.media.length != 0) {
		summary += ` (${note.media.length}つのメディア)`;
	}

	// 投票が添付されているとき
	if (note.poll) {
		summary += ' (投票)';
	}

	// 返信のとき
	if (note.replyId) {
		if (note.reply) {
			summary += ` RE: ${summarize(note.reply)}`;
		} else {
			summary += ' RE: ...';
		}
	}

	// Renoteのとき
	if (note.renoteId) {
		if (note.renote) {
			summary += ` RP: ${summarize(note.renote)}`;
		} else {
			summary += ' RP: ...';
		}
	}

	return summary.trim();
};

export default summarize;
