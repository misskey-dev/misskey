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
		reaction = decodeReaction(reaction, noteOwnerHost || null).reaction;

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
	reaction: string;
	/** name part on custom */
	name?: string;
	/** host part on custom */
	host?: string | null;
};

export function decodeReaction(str: string, noteOwnerHost?: string | null): DecodedReaction {
	const custom = str.match(/^:([\w+-]+)(?:@([\w.-]+))?:$/);

	if (custom) {
		const name = custom[1];
		const reacterHost = custom[2] || null;

		// リアクションした人のホスト基準で格納されているので、Note所有者のホスト基準に変換する
		const host = toPunyNullable(reacterHost) == toPunyNullable(noteOwnerHost) ? null : reacterHost;
		return {
			reaction: host ? `:${name}@${host}:` : `:${name}:`,
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

export function convertLegacyReaction(reaction: string, noteOwnerHost?: string): string {
	reaction = decodeReaction(reaction, noteOwnerHost || null).reaction;
	if (Object.keys(legacies).includes(reaction)) return legacies[reaction];
	return reaction;
}
