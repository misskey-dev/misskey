/**
 * 投稿を表す文字列を取得します。
 * @param {*} note (packされた)投稿
 */
const summarize = (note: any): string => {
	return (
		note.deletedAt ? '(削除された投稿)' :
		note.isHidden ? '(非公開の投稿)' :
		[
			[note.files && note.files.length, (x: any) => `(${x.files.length}つのファイル)`], // ファイルが添付されているとき
			[note.poll, (x: any) => '(投票)'], // 投票が添付されているとき
			[note.replyId, (x: any) => `RE: ${x.reply ? summarize(x.reply) : '...'}`, '\n\n'], // 返信のとき
			[note.renoteId, (x: any) => `RN: ${x.renote ? summarize(x.renote) : '...'}`, '\n\n'] // Renoteのとき
		].reduce((a: string, [p, c, s]) => p ? a ? a + (s || ' ') + c(note) : c(note) : a, note.text)); // 本文
};

export default summarize;
