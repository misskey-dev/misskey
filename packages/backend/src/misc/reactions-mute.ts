import { Packed } from '@/misc/json-schema.js';

export async function removeMutedUsersReactions(note: Packed<'Note'>, userIdsWhoMeMuting: Set<string>): Promise<Packed<'Note'>> {
	if (!note.reactions || !note.reactionAndUserPairCache) {
		delete note.reactionAndUserPairCache;
		return note;
	}

	const mutedReactionsCount = new Map<string, number>();

	for (const entry of note.reactionAndUserPairCache) {
		const [userId, reaction] = entry.split('/');
		if (!reaction || !userId) {
			continue;
		}

		// ミュートされたユーザーの場合のみ処理
		if (userIdsWhoMeMuting.has(userId)) {
			mutedReactionsCount.set(
				reaction,
				(mutedReactionsCount.get(reaction) || 0) + 1,
			);
		}
	}

	for (const reactionKey of Object.keys(note.reactions)) {
		const isLocalEmoji = reactionKey.endsWith('@.:');
		const normalizedKey = isLocalEmoji ? reactionKey.replace('@.', '') : reactionKey;
		const mutedCount = mutedReactionsCount.get(normalizedKey) || 0;

		// ミュートされたリアクションが存在する場合のみ処理
		if (mutedCount > 0) {
			note.reactions[reactionKey] -= mutedCount;
			note.reactionCount -= mutedCount;

			// リアクション数がゼロ以下になった場合は削除
			if (note.reactions[reactionKey] <= 0) {
				delete note.reactions[reactionKey];
			}
		}
	}
	delete note.reactionAndUserPairCache;
	return note;
}
