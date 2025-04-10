import { prefer } from '@/preferences.js';

const seenNotes: string[] = [];

export function checkCollapseRenote(appearNote: Record<string, any> | null, note: Record<string, any>, me: Record<string, any> | null | undefined): boolean {
	try {
		// 設定値の取得（prefer方式のみを使用）
		const collapseRenotes = prefer.s.collapseRenotes;
		const collapseSelfRenotes = prefer.s.collapseSelfRenotes;
		const collapseRenotesTrigger = prefer.s.collapseRenotesTrigger;

		// 基本的な条件チェック
		if (!collapseRenotes) return false;
		if (appearNote == null) return false;
		if (!note.renoteId) return false; // リノートでなければ省略しない

		// セルフリノートのチェック（リノートかつ同じユーザーID）
		if (collapseSelfRenotes) {
			if (note.userId === appearNote.userId) {
				return true;
			}
		}

		// 通常のリノート省略判定
		switch (collapseRenotesTrigger) {
			case 'action': {
				// 自分の投稿または自分がリアクションした投稿
				return (me && (me.id === note.userId || me.id === appearNote.userId)) || (appearNote.myReaction != null);
			}

			case 'all': {
				// すべてのリノートを省略
				return true;
			}

			case 'see': {
				// すでに見たノートを省略
				const isSeen = seenNotes.includes(note.id);
				if (isSeen) return true;

				// まだ見ていないノートの場合は追跡リストに追加
				seenNotes.push(note.id);
				// リストが大きくなりすぎないように古いエントリを削除
				if (seenNotes.length > 1000) {
					seenNotes.shift();
				}
				return false;
			}

			default: {
				return false;
			}
		}
	} catch (error) {
		// エラー発生時は安全のためfalseを返す
		console.error('Error in checkCollapseRenote:', error);
		return false;
	}
}
