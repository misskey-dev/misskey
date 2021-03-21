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

/**
 * 添付用絵文字情報を解決する
 * @param emojiName ノートやリアクションに添付されたカスタム絵文字名 (:は含めない, リアクションでローカルホストの場合は@.を付ける (これはdecodeReactionで可能))
 * @param noteUserHost ノートオーナーのホスト
 * @returns 絵文字情報, nullは未マッチを意味する
 */
export async function pupulateEmoji(emojiName: string, noteUserHost: string | null): Promise<PopulatedEmoji | null> {
	const match = emojiName.match(/^(\w+)(?:@([\w.-]+))?$/);
	if (!match) return null;

	const name = match[1];

	// クエリに使うホスト
	let host = match[2] === '.' ? null	// .はローカルホスト (ここがマッチするのはリアクションのみ)
		: match[2] === undefined ? noteUserHost	// ノートでホスト省略の場合はローカルホスト (ここがリアクションにマッチすることはない)
		: isSelfHost(match[2]) ? null	// 自ホスト指定
		: (match[2] || noteUserHost);	// 指定されたホスト || ノートのオーナーのホスト (こっちがリアクションにマッチすることはない)

	host = toPunyNullable(host);

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
	const emojis = await Promise.all(emojiNames.map(x => pupulateEmoji(x, noteUserHost)));
	return emojis.filter((x): x is PopulatedEmoji => x != null);
}

