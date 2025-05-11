/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { computed } from 'vue';
import { prefer } from '@/preferences.js';

// custom絵文字の情報からキーを作成する
export function makeEmojiMuteKey(props: { name: string; host?: string | null }) {
	return props.name.startsWith(':') ? props.name : `:${props.name}${props.host ? `@${props.host}` : ''}:`;
}

// custom絵文字の名前部分を取り出す
export function extractCustomEmojiName (name:string) {
	return (name[0] === ':' ? name.substring(1, name.length - 1) : name).replace('@.', '').split('@')[0];
}

// custom絵文字のホスト部分を取り出す
export function extractCustomEmojiHost (name:string) {
	// nameは:emojiName@host:の形式
	// 取り出したい部分はhostなので、@以降を取り出す
	const index = name.indexOf('@');
	if (index === -1) {
		return null;
	}
	const host = name.substring(index + 1, name.length - 1);
	if (host === '' || host === '.') {
		return null;
	}
	return host;
}

export async function mute(emoji: string) {
	const isCustomEmoji = emoji.startsWith(':') && emoji.endsWith(':');
	const emojiMuteKey = isCustomEmoji ?
		makeEmojiMuteKey({ name: extractCustomEmojiName(emoji), host: extractCustomEmojiHost(emoji) }) :
		emoji;
	const mutedEmojis = prefer.s.mutingEmojis;
	if (!mutedEmojis.includes(emoji)) {
		return prefer.commit('mutingEmojis', [...mutedEmojis, emojiMuteKey]);
	}
	throw new Error('Emoji is already muted');
}

export async function unmute(emoji:string) {
	const isCustomEmoji = emoji.startsWith(':') && emoji.endsWith(':');
	const emojiMuteKey = isCustomEmoji ?
		makeEmojiMuteKey({ name: extractCustomEmojiName(emoji), host: extractCustomEmojiHost(emoji) }) :
		emoji;
	const mutedEmojis = prefer.s.mutingEmojis;
	return prefer.commit('mutingEmojis', mutedEmojis.filter((e) => e !== emojiMuteKey));
}

export function checkMuted(emoji: string) {
	const isCustomEmoji = emoji.startsWith(':') && emoji.endsWith(':');
	const emojiMuteKey = isCustomEmoji ?
		makeEmojiMuteKey({ name: extractCustomEmojiName(emoji), host: extractCustomEmojiHost(emoji) }) :
		emoji;
	return computed(() => prefer.s.mutingEmojis.includes(emojiMuteKey));
}
