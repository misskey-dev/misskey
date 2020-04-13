import { emojiRegex } from './emoji-regex';
import { fetchMeta } from './fetch-meta';
import { Emojis } from '../models';
import { toPunyNullable } from './convert-host';

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

export function convertLegacyReactions(reactions: Record<string, number>, noteOwnerHost?: string | null) {
	const _reactions = {} as Record<string, number>;

	for (let reaction of Object.keys(reactions)) {
		reaction = decodeReaction(reaction).reaction;

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

export async function toDbReaction(reaction?: string | null, reacterHost?: string | null): Promise<string> {
	if (reaction == null) return await getFallbackReaction();

	reacterHost = toPunyNullable(reacterHost);

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
		const name = custom[1];
		const emoji = await Emojis.findOne({
			host: reacterHost || null,
			name,
		});

		if (emoji) return reacterHost ? `:${name}@${reacterHost}:` : `:${name}:`
	}

	return await getFallbackReaction();
}

type DecodedReaction = {
	/**
	 * リアクション名 (Unicode Emoji or ':name@hostname' or ':name@.')
	 */
	reaction: string;

	/**
	 * name (カスタム絵文字の場合name, Emojiクエリに使う)
	 */
	name?: string;

	/**
	 * host (カスタム絵文字の場合host, Emojiクエリに使う)
	 */
	host?: string | null;
};

export function decodeReaction(str: string): DecodedReaction {
	const custom = str.match(/^:([\w+-]+)(?:@([\w.-]+))?:$/);

	if (custom) {
		const name = custom[1];
		const host = custom[2] || null;

		return {
			reaction: `:${name}@${host || '.'}:`,	// ローカル分は@以降を省略するのではなく.にする
			name,
			host
		};
	}

	return {
		reaction: str,
		name: undefined,
		host: undefined
	};
}

export function convertLegacyReaction(reaction: string): string {
	reaction = decodeReaction(reaction).reaction;
	if (Object.keys(legacies).includes(reaction)) return legacies[reaction];
	return reaction;
}
