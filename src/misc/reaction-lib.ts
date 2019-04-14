import { emojiRegex } from './emoji-regex';
import fetchMeta from './fetch-meta';
import { Emojis } from '../models';

const basic10: Record<string, string> = {
	'👍': 'like',
	'❤': 'love',	// ここに記述する場合は異体字セレクタを入れない
	'😆': 'laugh',
	'🤔': 'hmm',
	'😮': 'surprise',
	'🎉': 'congrats',
	'💢': 'angry',
	'😥': 'confused',
	'😇': 'rip',
	'🍮': 'pudding',
};

export async function getFallbackReaction(): Promise<string> {
	const meta = await fetchMeta();
	return  meta.useStarForReactionFallback ? 'star' : 'like';
}

export async function toDbReaction(reaction?: string | null, enableEmoji = true): Promise<string> {
	if (reaction == null) return await getFallbackReaction();

	// 既存の文字列リアクションはそのまま
	if (Object.values(basic10).includes(reaction)) return reaction;

	if (!enableEmoji) return await getFallbackReaction();

	// Unicode絵文字
	const match = emojiRegex.exec(reaction);
	if (match) {
		// 合字を含む1つの絵文字
		const unicode = match[0];

		// 異体字セレクタ除去後の絵文字
		const normalized = unicode.match('\u200d') ? unicode : unicode.replace(/\ufe0f/g, '');

		// Unicodeプリンは寿司化不能とするため文字列化しない
		if (normalized === '🍮') return normalized;

		// プリン以外の既存のリアクションは文字列化する
		if (basic10[normalized]) return basic10[normalized];

		// それ以外はUnicodeのまま
		return normalized;
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
