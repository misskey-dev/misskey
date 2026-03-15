<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<!-- このコンポーネントの要素のclassは親から利用されるのでむやみに弄らないこと -->
<!-- フォルダの中にはカスタム絵文字だけ（Unicode絵文字もこっち） -->
<section v-if="!hasChildSection" v-panel style="border-radius: 6px; border-bottom: 0.5px solid var(--MI_THEME-divider);">
	<header class="_acrylic" @click="shown = !shown">
		<i class="toggle ti-fw" :class="shown ? 'ti ti-chevron-down' : 'ti ti-chevron-up'"></i> <slot></slot> (<i class="ti ti-icons"></i>:{{ emojis.length }})
	</header>
	<div v-if="shown" class="body">
		<button
			v-for="emoji in emojis"
			:key="emoji"
			:data-emoji="emoji"
			class="_button item"
			:disabled="disabledEmojis != null ? toValue(disabledEmojis).includes(emoji) : false"
			@pointerenter="computeButtonTitle"
			@click="emit('chosen', emoji, $event)"
		>
			<MkCustomEmoji v-if="emoji[0] === ':'" class="emoji" :name="emoji" :normal="true" :fallbackToImage="true"/>
			<MkEmoji v-else class="emoji" :emoji="emoji" :normal="true"/>
		</button>
	</div>
</section>
<!-- フォルダの中にはカスタム絵文字やフォルダがある -->
<section v-else v-panel style="border-radius: 6px; border-bottom: 0.5px solid var(--MI_THEME-divider);">
	<header class="_acrylic" @click="shown = !shown">
		<i class="toggle ti-fw" :class="shown ? 'ti ti-chevron-down' : 'ti ti-chevron-up'"></i> <slot></slot> (<i class="ti ti-folder ti-fw"></i>:{{ customEmojiTree?.length }} <i class="ti ti-icons ti-fw"></i>:{{ emojis.length }})
	</header>
	<div v-if="shown" style="padding-left: 9px;">
		<MkEmojiPickerSection
			v-for="child in customEmojiTree"
			:key="`custom:${child.value}`"
			:initialShown="initialShown"
			:categoryName="child.category"
			:hasChildSection="child.children.length !== 0"
			:customEmojiTree="child.children"
			@chosen="nestedChosen"
		>
			{{ child.value || i18n.ts.other }}
		</MkEmojiPickerSection>
	</div>
	<div v-if="shown" class="body">
		<button
			v-for="emoji in emojis"
			:key="emoji"
			:data-emoji="emoji"
			class="_button item"
			:disabled="disabledEmojis != null ? toValue(disabledEmojis).includes(emoji) : false"
			@pointerenter="computeButtonTitle"
			@click="emit('chosen', emoji, $event)"
		>
			<MkCustomEmoji v-if="emoji[0] === ':'" class="emoji" :name="emoji" :normal="true"/>
			<MkEmoji v-else class="emoji" :emoji="emoji" :normal="true"/>
		</button>
	</div>
</section>
</template>

<script lang="ts" setup>
import { ref, watch, toValue } from 'vue';
import { getEmojiName } from '@@/js/emojilist.js';
import type { MaybeRef } from 'vue';
import type { CustomEmojiFolderTree } from '@@/js/emojilist.js';
import { i18n } from '@/i18n.js';
import { getEmojisByCategory } from '@/utility/idb-emoji-store.js';
import MkEmojiPickerSection from '@/components/MkEmojiPicker.section.vue';

const props = defineProps<{
	categoryName: string;
	disabledEmojis?: MaybeRef<string[]>;
	initialShown?: boolean;
	hasChildSection?: boolean;
	customEmojiTree?: CustomEmojiFolderTree[];
}>();

const emit = defineEmits<{
	(ev: 'chosen', v: string, event: PointerEvent): void;
}>();

const emojis = ref<string[]>([]);

watch(() => props.categoryName, async (newCategory) => {
	if (props.hasChildSection) {
		emojis.value = [];
	} else {
		emojis.value = (await getEmojisByCategory(newCategory)).map(e => e.name);
	}
}, { immediate: true });

const shown = ref(!!props.initialShown);

/** @see MkEmojiPicker.vue */
function computeButtonTitle(ev: PointerEvent): void {
	const elm = ev.target as HTMLElement;
	const emoji = elm.dataset.emoji as string;
	elm.title = getEmojiName(emoji);
}

function nestedChosen(emoji: string, ev: PointerEvent) {
	emit('chosen', emoji, ev);
}
</script>
