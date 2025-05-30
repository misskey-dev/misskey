import * as Misskey from 'misskey-js';

/**
 * 指定されたノートがプライベートノート（自分のみ閲覧可能）かどうかを判定
 * 直接プライベートノートか、リプライチェーンにプライベートノートが含まれる場合に true を返す
 */
export function isPrivateNoteInReplyChain(note: Misskey.entities.Note): boolean {
	// 直接のプライベートノートをチェック
	if (note.visibility === 'specified' && (!note.visibleUserIds || note.visibleUserIds.length === 0)) {
		return true;
	}

	// 自分のみ宛てのノートをチェック
	if (note.visibility === 'specified' &&
        note.visibleUserIds &&
        note.visibleUserIds.length === 1 &&
        note.visibleUserIds[0] === note.userId) {
		return true;
	}

	// リプライチェーンを再帰的にチェック
	if (note.reply) {
		return isPrivateNoteInReplyChain(note.reply);
	}

	return false;
}

/**
 * 指定されたノートのリプライを作成する際に自動的にプライベートノートにすべきかどうかを判定
 */
export function shouldReplyBePrivate(replyTo: Misskey.entities.Note): boolean {
	return isPrivateNoteInReplyChain(replyTo);
}
