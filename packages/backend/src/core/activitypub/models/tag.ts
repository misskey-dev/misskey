/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toArray, unique } from '@/misc/prelude/array.js';
import { isHashtag, isObjectLink, OBJECT_LINK_MEDIA_TYPE } from '../type.js';
import type { IObject, IApHashtag } from '../type.js';

export function extractApHashtags(tags: IObject | IObject[] | null | undefined): string[] {
	if (tags == null) return [];

	const hashtags = extractApHashtagObjects(tags);

	return hashtags.map(tag => {
		const m = tag.name.match(/^#(.+)/);
		return m ? m[1] : null;
	}).filter(x => x != null);
}

export function extractApHashtagObjects(tags: IObject | IObject[] | null | undefined): IApHashtag[] {
	if (tags == null) return [];
	return toArray(tags).filter(isHashtag);
}

// 候補の解決に失敗し続けるとリモート fetch が候補数ぶん発生するため、相異なる URI の数に上限を設ける
// (引用は 1 ノートにつき 1 件しか成立せず、解決は最初の成功で打ち切られる)
const MAX_QUOTE_LINKS = 4;

// 受信時に引用リンクとして受け入れる mediaType (送信時は OBJECT_LINK_MEDIA_TYPE のみを使う)
const QUOTE_LINK_MEDIA_TYPES = [
	OBJECT_LINK_MEDIA_TYPE,
	'application/activity+json',
].map(x => x.toLowerCase());

/**
 * tag に含まれる Object Link から引用対象の URI を抽出する (FEP-e232)
 * ActivityStreams の mediaType を持つ Link、または rel が `_misskey_quote` の Link を引用とみなす。
 */
export function extractQuoteLinkUris(tags: IObject | IObject[] | null | undefined): string[] {
	if (tags == null) return [];
	return unique(toArray(tags)
		.filter(isObjectLink)
		.filter(link =>
			QUOTE_LINK_MEDIA_TYPES.includes(link.mediaType.toLowerCase()) ||
			toArray(link.rel).includes('https://misskey-hub.net/ns#_misskey_quote'),
		)
		.map(link => link.href))
		.slice(0, MAX_QUOTE_LINKS);
}
