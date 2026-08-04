<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
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

	<hr>

	<SearchMarker :keywords="['sync', 'devices']">
		<MkSwitch :modelValue="syncEnabled" @update:modelValue="changeSyncEnabled">
			<template #label><i class="ti ti-cloud-cog"></i> <SearchLabel>{{ i18n.ts.syncBetweenDevices }}</SearchLabel></template>
		</MkSwitch>
	</SearchMarker>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import type { MenuItem } from '@/types/menu';
import MkButton from '@/components/MkButton.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { prefer } from '@/preferences.js';
import {
	mute as muteEmoji,
	unmute as unmuteEmoji,
	extractCustomEmojiName as customEmojiName,
	extractCustomEmojiHost as customEmojiHost,
} from '@/utility/emoji-mute.js';

const emojis = prefer.model('mutingEmojis');

function getHTMLElement(ev: PointerEvent): HTMLElement {
	const target = ev.currentTarget ?? ev.target;
	return target as HTMLElement;
}

function add(ev: PointerEvent) {
	os.pickEmoji(getHTMLElement(ev), { showPinned: false }).then((emoji) => {
		if (emoji) {
			muteEmoji(emoji);
		}
	});
}

function onEmojiClick(ev: PointerEvent, emoji: string) {
	const menuItems : MenuItem[] = [{
		type: 'label',
		text: emoji,
	}, {
		text: i18n.ts.emojiUnmute,
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
		unmuteEmoji(emoji);
	});
}

const syncEnabled = ref(prefer.isSyncEnabled('mutingEmojis'));

function changeSyncEnabled(value: boolean) {
	if (value) {
		prefer.enableSync('mutingEmojis').then((res) => {
			if (res == null) return;
			if (res.enabled) syncEnabled.value = true;
		});
	} else {
		prefer.disableSync('mutingEmojis');
		syncEnabled.value = false;
	}
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
