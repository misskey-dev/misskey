<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkFolder :defaultOpen="true">
	<template #icon><i class="ti ti-palette"></i></template>
	<template #label>{{ palette.name === '' ? '(' + i18n.ts.noName + ')' : palette.name }}</template>
	<template #footer>
		<div class="_buttons">
			<MkButton @click="rename"><i class="ti ti-pencil"></i> {{ i18n.ts.rename }}</MkButton>
			<MkButton @click="copy"><i class="ti ti-copy"></i> {{ i18n.ts.copy }}</MkButton>
			<MkButton danger @click="paste"><i class="ti ti-clipboard"></i> {{ i18n.ts.paste }}</MkButton>
			<MkButton danger iconOnly style="margin-left: auto;" @click="del"><i class="ti ti-trash"></i></MkButton>
		</div>
	</template>

	<div>
		<div v-panel style="border-radius: 6px;">
			<MkDraggable
				:modelValue="emojis.map(emoji => ({ id: emoji, emoji }))"
				direction="horizontal"
				:class="$style.emojis"
				group="emojiPalettes"
				@update:modelValue="v => emojis = v.map(x => x.emoji)"
			>
				<template #default="{ item }">
					<button class="_button" :class="$style.emojisItem" @click="remove(item.emoji, $event)">
						<!-- pointer-eventsをnoneにしておかないとiOSなどでドラッグしたときに画像の方に判定が持ってかれる -->
						<MkCustomEmoji v-if="item.emoji[0] === ':'" style="pointer-events: none;" :name="item.emoji" :normal="true" :fallbackToImage="true"/>
						<MkEmoji v-else style="pointer-events: none;" :emoji="item.emoji" :normal="true"/>
					</button>
				</template>
				<template #footer>
					<button class="_button" :class="$style.emojisAdd" @click="pick">
						<i class="ti ti-plus"></i>
					</button>
				</template>
			</MkDraggable>
		</div>
		<div :class="$style.editorCaption">{{ i18n.ts.reactionSettingDescription2 }}</div>
	</div>
</MkFolder>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { deepClone } from '@/utility/clone.js';
import MkCustomEmoji from '@/components/global/MkCustomEmoji.vue';
import MkEmoji from '@/components/global/MkEmoji.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkDraggable from '@/components/MkDraggable.vue';
import { copyToClipboard } from '@/utility/copy-to-clipboard.js';

const props = defineProps<{
	palette: {
		id: string;
		name: string;
		emojis: string[];
	};
}>();

const emit = defineEmits<{
	(ev: 'updateEmojis', emojis: string[]): void,
	(ev: 'updateName', name: string): void,
	(ev: 'del'): void,
}>();

const emojis = ref<string[]>(deepClone(props.palette.emojis));

watch(emojis, () => {
	emit('updateEmojis', emojis.value);
}, { deep: true });

function remove(reaction: string, ev: PointerEvent) {
	os.popupMenu([{
		text: i18n.ts.remove,
		action: () => {
			emojis.value = emojis.value.filter(x => x !== reaction);
		},
	}], getHTMLElement(ev));
}

function pick(ev: PointerEvent) {
	os.pickEmoji(getHTMLElement(ev), {
		showPinned: false,
	}).then(it => {
		const emoji = it;
		if (!emojis.value.includes(emoji)) {
			emojis.value.push(emoji);
		}
	});
}

function getHTMLElement(ev: PointerEvent): HTMLElement {
	const target = ev.currentTarget ?? ev.target;
	return target as HTMLElement;
}

function rename() {
	os.inputText({
		title: i18n.ts.rename,
		default: props.palette.name,
	}).then(({ canceled, result: name }) => {
		if (canceled) return;
		if (name != null) {
			emit('updateName', name);
		}
	});
}

function copy() {
	copyToClipboard(emojis.value.join(' '));
}

function paste() {
	// TODO: validate
	navigator.clipboard.readText().then(text => {
		emojis.value = text.split(' ');
	});
}

function del(ev: PointerEvent) {
	os.popupMenu([{
		text: i18n.ts.delete,
		action: () => {
			emit('del');
		},
	}], ev.currentTarget ?? ev.target);
}
</script>

<style lang="scss" module>
.tab {
	margin: calc(var(--MI-margin) / 2) 0;
	padding: calc(var(--MI-margin) / 2) 0;
	background: var(--MI_THEME-bg);
}

.emojis {
	padding: 12px;
	font-size: 1.1em;
}

.emojisItem {
	display: inline-block;
	padding: 8px;
	cursor: move;
}

.emojisAdd {
	display: inline-block;
	padding: 8px;
}

.editorCaption {
	font-size: 0.85em;
	padding: 8px 0 0 0;
	color: color(from var(--MI_THEME-fg) srgb r g b / 0.75);
}
</style>
