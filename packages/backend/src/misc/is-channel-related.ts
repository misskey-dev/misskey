/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { MiNote } from '@/models/Note.js';
import { Packed } from '@/misc/json-schema.js';

/**
 * {@link note}が{@link channelIds}のチャンネルに関連するかどうかを判定し、関連する場合はtrueを返します。
 * 関連するというのは、{@link channelIds}のチャンネルに向けての投稿であるか、またはそのチャンネルの投稿をリノート・引用リノートした投稿であるかを指します。
 *
 * @param note 確認対象のノート
 * @param channelIds 確認対象のチャンネルID一覧
 * @param ignoreAuthor trueの場合、ノートの所属チャンネルが{@link channelIds}に含まれていても無視します（デフォルトはfalse）
 */
export function isChannelRelated(note: MiNote | Packed<'Note'>, channelIds: Set<string>, ignoreAuthor = false): boolean {
	// ノートの所属チャンネルが確認対象のチャンネルID一覧に含まれている場合
	if (!ignoreAuthor && note.channelId && channelIds.has(note.channelId)) {
		return true;
	}

	const renoteChannelId = note.renote?.channelId;
	if (renoteChannelId != null && renoteChannelId !== note.channelId && channelIds.has(renoteChannelId)) {
		return true;
	}

	// NOTE: リプライはchannelIdのチェックだけでOKなはずなので見てない(チャンネルのノートにチャンネル外からのリプライまたはその逆はないはずなので）

	return false;
}
