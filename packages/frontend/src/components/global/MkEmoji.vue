<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<img v-if="!useOsNativeEmojis" :class="$style.root" :src="url" :alt="props.emoji" decoding="async" @pointerenter="computeTitle" @click="onClick"/>
<span v-else :alt="props.emoji" @pointerenter="computeTitle" @click="onClick">{{ colorizedNativeEmoji }}</span>
</template>

<script lang="ts" setup>
import { computed, inject } from 'vue';
import { char2twemojiFilePath, char2fluentEmojiFilePath } from '@/scripts/emoji-base.js';
import { defaultStore } from '@/store.js';
import { colorizeEmoji, getEmojiName } from '@/scripts/emojilist.js';
import * as os from '@/os.js';
import copyToClipboard from '@/scripts/copy-to-clipboard.js';
import * as sound from '@/scripts/sound.js';
import { i18n } from '@/i18n.js';

const props = defineProps<{
	emoji: string;
	menu?: boolean;
	menuReaction?: boolean;
}>();

const react = inject<((name: string) => void) | null>('react', null);

const char2path = defaultStore.state.emojiStyle === 'twemoji' ? char2twemojiFilePath : char2fluentEmojiFilePath;

const useOsNativeEmojis = computed(() => defaultStore.state.emojiStyle === 'native');
const url = computed(() => char2path(props.emoji));
const colorizedNativeEmoji = computed(() => colorizeEmoji(props.emoji));

// Searching from an array with 2000 items for every emoji felt like too energy-consuming, so I decided to do it lazily on pointerenter
function computeTitle(event: PointerEvent): void {
	const title = getEmojiName(props.emoji as string) ?? props.emoji as string;
	(event.target as HTMLElement).title = title;
}

function onClick(ev: MouseEvent) {
	if (props.menu) {
		os.popupMenu([{
			type: 'label',
			text: props.emoji,
		}, {
			text: i18n.ts.copy,
			icon: 'ti ti-copy',
			action: () => {
				copyToClipboard(props.emoji);
				os.success();
			},
		}, ...(props.menuReaction && react ? [{
			text: i18n.ts.doReaction,
			icon: 'ti ti-plus',
			action: () => {
				react(props.emoji);
				sound.playMisskeySfx('reaction');
			},
		}] : [])], ev.currentTarget ?? ev.target);
	}
}
</script>

<style lang="scss" module>
.root {
	height: 1.25em;
	vertical-align: -0.25em;
}
</style>
