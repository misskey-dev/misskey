import { emojiRegex } from './emoji-regex';
import { fetchMeta } from './fetch-meta';
import { Emojis } from '../models';

const legacies: Record<string, string> = {
	'like':     '👍',
	'love':     '❤', // ここに記述する場合は異体字セレクタを入れない
	'laugh':    '😆',
	'hmm':      '🤔',
	'surprise': '😮',
	'congrats': '🎉',
	'angry':    '💢',
	'confused': '😥',
	'rip':      '😇',
	'pudding':  '🍮',
	'star':     '⭐',
};

export async function getFallbackReaction(): Promise<string> {
	const meta = await fetchMeta();
	return meta.useStarForReactionFallback ? '⭐' : '👍';
}

export function convertLegacyReactions(reactions: Record<string, number>) {
	const _reactions = {} as Record<string, number>;

	for (const reaction of Object.keys(reactions)) {
		if (Object.keys(legacies).includes(reaction)) {
			if (_reactions[legacies[reaction]]) {
				_reactions[legacies[reaction]] += reactions[reaction];
			} else {
				_reactions[legacies[reaction]] = reactions[reaction];
			}
		} else {
			if (_reactions[reaction]) {
				_reactions[reaction] += reactions[reaction];
			} else {
				_reactions[reaction] = reactions[reaction];
			}
		}
	}

	return _reactions;
}

export async function toDbReaction(reaction?: string | null): Promise<string> {
	if (reaction == null) return await getFallbackReaction();

	// 文字列タイプのリアクションを絵文字に変換
	if (Object.keys(legacies).includes(reaction)) return legacies[reaction];

	// Unicode絵文字
	const match = emojiRegex.exec(reaction);
	if (match) {
		// 合字を含む1つの絵文字
		const unicode = match[0];

		// 異体字セレクタ除去
		return unicode.match('\u200d') ? unicode : unicode.replace(/\ufe0f/g, '');
	}

	const custom = reaction.match(/^:([\w+-]+):$/);
	if (custom) {
		const emoji = await Emojis.findOne({
			host: null,
			name: custom[1],
		});

		if (emoji) return reaction;
	}

	return await getFallbackReaction();
}

export function convertLegacyReaction(reaction: string): string {
	if (Object.keys(legacies).includes(reaction)) return legacies[reaction];
	return reaction;
}
