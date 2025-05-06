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

export function mute(emoji: string) {
	const mutedEmojis = prefer.r.mutingEmojis.value;
	if (!mutedEmojis.includes(emoji)) {
		prefer.commit('mutingEmojis', [...mutedEmojis, emoji]);
	}
}

export function unmute(emoji:string) {
	const mutedEmojis = prefer.r.mutingEmojis.value;
	const index = mutedEmojis.indexOf(emoji);
	if (index !== -1) {
		mutedEmojis.splice(index, 1);
		prefer.commit('mutingEmojis', mutedEmojis);
	}
}

export function checkMuted(emoji: string) {
	return computed(() => prefer.r.mutingEmojis.value.includes(emoji));
}
