/**
 * 投稿を表す文字列を取得します。
 * @param {*} note (packされた)投稿
 */
const summarize = (note: any): string => {
	return (
		note.deletedAt ? '(削除された投稿)' :
		note.isHidden ? '(非公開の投稿)' :
		[
			[note.files && note.files.length, () => `(${note.files.length}つのファイル)`], // ファイルが添付されているとき
			[note.poll, () => '(投票)'], // 投票が添付されているとき
			[note.replyId, () => `RE: ${note.reply ? summarize(note.reply) : '...'}`, '\n\n'], // 返信のとき
			[note.renoteId, () => `RN: ${note.renote ? summarize(note.renote) : '...'}`, '\n\n'] // Renoteのとき
		].reduce((a: string, [p, c, s]) => p ? a ? a + (s || ' ') + c() : c() : a,
			note.text)); // 本文
};

export default summarize;
