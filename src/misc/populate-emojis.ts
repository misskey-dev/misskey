import { Emojis } from '../models';
import { Emoji } from '../models/entities/emoji';
import { Cache } from './cache';
import { isSelfHost, toPunyNullable } from './convert-host';

const cache = new Cache<Emoji | null>(1000 * 60 * 60);

/**
 * 添付用絵文字情報
 */
type PopulatedEmoji = {
	name: string;
	url: string;
};

function normalizeHost(src: string | undefined, noteUserHost: string | null): string | null {
	// クエリに使うホスト
	let host = src === '.' ? null	// .はローカルホスト (ここがマッチするのはリアクションのみ)
		: src === undefined ? noteUserHost	// ノートなどでホスト省略表記の場合はローカルホスト (ここがリアクションにマッチすることはない)
		: isSelfHost(src) ? null	// 自ホスト指定
		: (src || noteUserHost);	// 指定されたホスト || ノートなどの所有者のホスト (こっちがリアクションにマッチすることはない)

	host = toPunyNullable(host);

	return host;
}

function parseEmojiStr(emojiName: string, noteUserHost: string | null) {
	const match = emojiName.match(/^(\w+)(?:@([\w.-]+))?$/);
	if (!match) return { name: null, host: null };

	const name = match[1];

	// ホスト正規化
	const host = toPunyNullable(normalizeHost(match[2], noteUserHost));

	return { name, host };
}

/**
 * 添付用絵文字情報を解決する
 * @param emojiName ノートやユーザープロフィールに添付された、またはリアクションのカスタム絵文字名 (:は含めない, リアクションでローカルホストの場合は@.を付ける (これはdecodeReactionで可能))
 * @param noteUserHost ノートやユーザープロフィールの所有者のホスト
 * @returns 絵文字情報, nullは未マッチを意味する
 */
export async function populateEmoji(emojiName: string, noteUserHost: string | null): Promise<PopulatedEmoji | null> {
	const { name, host } = parseEmojiStr(emojiName, noteUserHost);
	if (name == null) return null;

	const queryOrNull = async () => (await Emojis.findOne({
		name,
		host
	})) || null;

	const emoji = await cache.fetch(`${name} ${host}`, queryOrNull);

	if (emoji == null) return null;

	return {
		name: emojiName,
		url: emoji.url,
	};
}

/**
 * 複数の添付用絵文字情報を解決する (キャシュ付き, 存在しないものは結果から除外される)
 */
export async function populateEmojis(emojiNames: string[], noteUserHost: string | null): Promise<PopulatedEmoji[]> {
	const emojis = await Promise.all(emojiNames.map(x => populateEmoji(x, noteUserHost)));
	return emojis.filter((x): x is PopulatedEmoji => x != null);
}

