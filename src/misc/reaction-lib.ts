import { emojiRegex } from './emoji-regex';
import { fetchMeta } from './fetch-meta';
import { Emojis } from '../models';

const legacy10: Record<string, string> = {
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
};

export async function getFallbackReaction(): Promise<string> {
	const meta = await fetchMeta();
	return meta.useStarForReactionFallback ? '⭐' : '👍';
}

export async function toDbReaction(reaction?: string | null): Promise<string> {
	if (reaction == null) return await getFallbackReaction();

	// 文字列タイプのリアクションを絵文字に変換
	if (Object.keys(legacy10).includes(reaction)) return legacy10[reaction];

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
	if (Object.keys(legacy10).includes(reaction)) return legacy10[reaction];
	return reaction;
}
