import { Packed } from '@/misc/json-schema.js';

export async function removeMutedUsersReactions(
	note: Packed<'Note'>,
	userIdsWhoMeMuting: Set<string>,
	removeReactionAndUserPairCache = true,
): Promise<Packed<'Note'>> {
	// 指定されたオブジェクト（note または renote）に対して、
	// ミュートされたユーザーのリアクションのカウントを差し引き、更新する
	function removeMutedUserReactionCounts(target: {
		reactions?: Record<string, number>;
		reactionAndUserPairCache?: string[];
		reactionCount?: number;
	}): void {
		if (!target.reactions) return;

		const cache = target.reactionAndUserPairCache;
		if (!cache) {
			if (removeReactionAndUserPairCache) delete target.reactionAndUserPairCache;
			return;
		}

		// ミュート対象ユーザーからの各リアクションの合計数を集計
		const mutedCounts: Record<string, number> = Object.create(null);
		const filtered: string[] = [];

		for (let i = 0, len = cache.length; i < len; i++) {
			const entry = cache[i];
			const sep = entry.indexOf('/');
			if (sep === -1) {
				filtered.push(entry);
				continue;
			}
			const userId = entry.slice(0, sep);
			const reaction = entry.slice(sep + 1);

			if (userId && reaction && userIdsWhoMeMuting.has(userId)) {
				mutedCounts[reaction] = (mutedCounts[reaction] || 0) + 1;
			} else {
				filtered.push(entry);
			}
		}

		// 集計結果に基づき、対象のリアクションカウントからミュート分を減算
		const keys = Object.keys(target.reactions);
		for (let i = 0, len = keys.length; i < len; i++) {
			const key = keys[i];
			const normalizedKey = key.endsWith('@.:') ? key.replace('@.', '') : key;
			const subtract = mutedCounts[normalizedKey] || 0;
			if (subtract > 0) {
				target.reactions[key] -= subtract;
				if (typeof target.reactionCount === 'number') {
					target.reactionCount -= subtract;
				}
				if (target.reactions[key] <= 0) {
					delete target.reactions[key];
				}
			}
		}

		// キャッシュを更新
		if (removeReactionAndUserPairCache) {
			delete target.reactionAndUserPairCache;
		} else {
			target.reactionAndUserPairCache = filtered;
		}
	}

	// note と renote（存在する場合）に対して処理を適用
	removeMutedUserReactionCounts(note);
	if (note.renote) {
		removeMutedUserReactionCounts(note.renote);
	}

	return note;
}
