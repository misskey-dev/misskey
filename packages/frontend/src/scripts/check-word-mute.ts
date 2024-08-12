export function checkWordMute(note: Record<string, any>, me: Record<string, any> | null | undefined, mutedWords: Array<string | string[]>): boolean {
	// 自分自身
	if (me && (note.userId === me.id)) return false;

	if (mutedWords.length > 0) {
		const text = ((note.cw ?? '') + '\n' + (note.text ?? '')).trim();
		if (!text) return false;

		const filteredFilters = mutedWords.map(filter => {
			if (Array.isArray(filter)) {
				// 空でないキーワードのセットを作成
				const cleaned = filter.filter(keyword => keyword !== '');
				return cleaned.length > 0 ? new Set(cleaned) : null;
			} else {
				// 正規表現を事前にコンパイル
				const regexp = filter.match(/^\/(.+)\/(.*)$/);
				return regexp ? new RegExp(regexp[1], regexp[2]) : null;
			}
		}).filter(Boolean); // nullを除外

		// テキストをフィルタでチェック
		for (const filter of filteredFilters) {
			if (filter instanceof Set) {
				// セットの場合、全てのキーワードが含まれているかチェック
				if ([...filter].every(keyword => text.includes(keyword))) {
					return true;
				}
			} else if (filter instanceof RegExp) {
				// 正規表現の場合
				if (filter.test(text)) {
					return true;
				}
			}
		}
	}

	return false;
}
