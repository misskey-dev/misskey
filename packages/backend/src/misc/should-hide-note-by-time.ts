/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * ノートが指定された時間条件に基づいて非表示対象かどうかを判定する
 * @param hiddenBefore 非表示条件（負の値: 作成からの経過秒数、正の値: UNIXタイムスタンプ秒、null: 判定しない）
 * @param createdAt ノートの作成日時（ISO 8601形式の文字列 または Date オブジェクト）
 * @returns 非表示にすべき場合は true
 */
export function shouldHideNoteByTime(hiddenBefore: number | null | undefined, createdAt: string | Date): boolean {
	if (hiddenBefore == null) {
		return false;
	}

	const createdAtTime = typeof createdAt === 'string' ? new Date(createdAt).getTime() : createdAt.getTime();

	if (hiddenBefore <= 0) {
		// 負の値: 作成からの経過時間(秒)で判定
		const elapsedSeconds = (Date.now() - createdAtTime) / 1000;
		const hideAfterSeconds = Math.abs(hiddenBefore);
		return elapsedSeconds >= hideAfterSeconds;
	} else {
		// 正の値: 絶対的なタイムスタンプ(秒)で判定
		const createdAtSeconds = createdAtTime / 1000;
		return createdAtSeconds <= hiddenBefore;
	}
}
