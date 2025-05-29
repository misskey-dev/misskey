import * as Misskey from 'misskey-js';

export function isPrivateNoteInReplyChain(note: Misskey.entities.Note): boolean {
    // 基本的なプライベートノート
    if (note.visibility === 'specified' && (!note.visibleUserIds || note.visibleUserIds.length === 0)) {
        return true;
    }

    // 自分のみノートへの自分のリプライ
    if (note.visibility === 'specified' &&
        note.visibleUserIds &&
        note.visibleUserIds.length === 1 &&
        note.visibleUserIds[0] === note.userId &&
        note.reply) {
        // 再帰的にリプライ先をチェック
        return isPrivateNoteInReplyChain(note.reply);
    }

    return false;
}
