<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.emojis">
	<div v-for="emoji in emojis" :key="`emojiMute-${emoji}`" :class="$style.emoji" @click="onEmojiClick($event, emoji)">
		<MkCustomEmoji
			v-if="emoji.startsWith(':')"
			:name="customEmojiName(emoji)"
			:host="customEmojiHost(emoji)"
			:normal="true"
			:menu="false"
			:menuReaction="false"
			:ignoreMuted="true"
		/>
		<MkEmoji
			v-else
			:emoji="emoji"
			:menu="false"
			:menuReaction="false"
			:ignoreMuted="true"
		></MkEmoji>
	</div>
</div>

<MkButton primary inline @click="add"><i class="ti ti-plus"></i> {{ i18n.ts.add }}</MkButton>
</template>

<script lang="ts" setup>
import type { MenuItem } from '@/types/menu';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { prefer } from '@/preferences.js';

const emojis = prefer.model('mutingEmojis');

function customEmojiName (name:string) {
	return (name[0] === ':' ? name.substring(1, name.length - 1) : name).replace('@.', '').split('@')[0];
}

function customEmojiHost (name:string) {
	// nameは:emojiName@host:の形式
	// 取り出したい部分はhostなので、@以降を取り出す
	const index = name.indexOf('@');
	if (index === -1) {
		return null;
	}
	return name.substring(index + 1, name.length - 1);
}

function getHTMLElement(ev: MouseEvent): HTMLElement {
	const target = ev.currentTarget ?? ev.target;
	return target as HTMLElement;
}

function mute(emoji: string) {
	const emojiCodeToMute = emoji.startsWith(':') ? emoji : `:${emoji}:`;
	os.confirm({
		type: 'question',
		title: i18n.tsx.muteX({ x: emojiCodeToMute }),
	}).then(({ canceled }) => {
		if (canceled) {
			return;
		}
		const mutedEmojis = prefer.r.mutingEmojis.value;
		if (!mutedEmojis.includes(emojiCodeToMute)) {
			prefer.commit('mutingEmojis', [...mutedEmojis, emojiCodeToMute]);
		}
	});
}

function add(ev: MouseEvent) {
	os.pickEmoji(getHTMLElement(ev), { showPinned: false }).then((emoji) => {
		if (emoji) {
			const mutedEmojis = prefer.r.mutingEmojis.value;
			if (!mutedEmojis.includes(emoji)) {
				prefer.commit('mutingEmojis', [...mutedEmojis, emoji]);
			}
		}
	});
}

function onEmojiClick(ev: MouseEvent, emoji: string) {
	const menuItems : MenuItem[] = [{
		type: 'label',
		text: emoji,
	}, {
		text: i18n.ts.unmute,
		icon: 'ti ti-mood-off',
		action: () => unmute(emoji),
	}];
	os.popupMenu(menuItems, ev.currentTarget ?? ev.target);
}

function unmute(emoji: string) {
	os.confirm({
		type: 'question',
		title: i18n.tsx.unmuteX({ x: emoji }),
	}).then(({ canceled }) => {
		if (canceled) {
			return;
		}
		const mutedEmojis = prefer.r.mutingEmojis.value;
		if (mutedEmojis.includes(emoji)) {
			prefer.commit('mutingEmojis', mutedEmojis.filter((e) => e !== emoji));
		}
	});
}
</script>
<style module>
.emojis {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 4px;

	&:empty {
		display: none;
	}
}

.emoji {
	display: inline-flex;
	height: 42px;
	padding: 0 6px;
	font-size: 1.5em;
	border-radius: 6px;
	align-items: center;
	justify-content: center;
	background: var(--MI_THEME-buttonBg);
}
</style>
