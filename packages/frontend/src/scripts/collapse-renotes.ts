import { defaultStore } from '@/store.js';

const seenNotes: string[] = [];

export function checkCollapseRenote(appearNote: Record<string, any> | null, note: Record<string, any>, me: Record<string, any> | null | undefined): boolean {
	try {
		// 基本的な条件チェック
		if (!defaultStore.state.collapseRenotes) return false;
		if (appearNote == null) return false;

		// セルフリノートのチェック（リノートかつ同じユーザーID）
		if (defaultStore.state.collapseSelfRenotes) {
			// リノートであることを確認（renoteIdが存在する）
			if (note.renoteId && note.userId === appearNote.userId) {
				return true;
			}
		}

		// 通常のリノート省略判定
		switch (defaultStore.state.collapseRenotesTrigger) {
			case 'action': {
				return (me && (me.id === note.userId || me.id === appearNote.userId)) || (appearNote.myReaction != null);
			}

			case 'all': {
				return true;
			}

			case 'see': {
				const isSeen = seenNotes.includes(note.id);
				if (isSeen) return true;

				seenNotes.push(note.id);
				return false;
			}

			default: {
				return false;
			}
		}
	} catch (e) {
		// エラー発生時は安全のためfalseを返す
		console.error('Error in checkCollapseRenote:', e);
		return false;
	}
}
