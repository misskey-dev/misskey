<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModal
	ref="modal"
	v-slot="{ type, maxHeight }"
	:zPriority="'middle'"
	:preferType="defaultStore.state.emojiPickerUseDrawerForMobile === false ? 'popup' : 'auto'"
	:transparentBg="true"
	:manualShowing="manualShowing"
	:src="src"
	@click="modal?.close()"
	@opening="opening"
	@close="emit('close')"
	@closed="emit('closed')"
>
	<MkEmojiPicker
		ref="picker"
		class="_popup _shadow"
		:class="{ [$style.drawer]: type === 'drawer' }"
		:showPinned="showPinned"
		:pinnedEmojis="pinnedEmojis"
		:asReactionPicker="asReactionPicker"
		:targetNote="targetNote"
		:asDrawer="type === 'drawer'"
		:max-height="maxHeight"
		@chosen="chosen"
	/>
	<div v-if="manualReactionInput" :class="$style.remoteReactionInputWrapper">
		<span>{{ i18n.ts.remoteCustomEmojiMuted }}</span>
		<MkInput v-model="remoteReactionName" placeholder=":emojiname@host:" autocapitalize="off"/>
		<MkButton :disabled="!(remoteReactionName && remoteReactionName[0] === ':')" @click="chosen(remoteReactionName)">
			{{ i18n.ts.add }}
		</MkButton>
		<div :class="$style.emojiContainer">
			<MkCustomEmoji v-if="remoteReactionName && remoteReactionName[0] === ':' " :class="$style.emoji" :name="remoteReactionName" :normal="true"/>
		</div>
	</div>
</MkModal>
</template>

<script lang="ts" setup>
import * as Misskey from 'misskey-js';
import { shallowRef, ref } from 'vue';
import { i18n } from '@/i18n.js';
import MkModal from '@/components/MkModal.vue';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkEmojiPicker from '@/components/MkEmojiPicker.vue';
import { defaultStore } from '@/store.js';
import MkCustomEmoji from '@/components/global/MkCustomEmoji.vue';

const props = withDefaults(defineProps<{
	manualShowing?: boolean | null;
	src?: HTMLElement;
	showPinned?: boolean;
	pinnedEmojis?: string[],
	asReactionPicker?: boolean;
	targetNote?: Misskey.entities.Note;
	choseAndClose?: boolean;
	manualReactionInput?: boolean;
}>(), {
	manualShowing: null,
	showPinned: true,
	pinnedEmojis: undefined,
	asReactionPicker: false,
	choseAndClose: true,
	manualReactionInput: false,
});

const emit = defineEmits<{
	(ev: 'done', v: string): void;
	(ev: 'close'): void;
	(ev: 'closed'): void;
}>();

const modal = shallowRef<InstanceType<typeof MkModal>>();
const picker = shallowRef<InstanceType<typeof MkEmojiPicker>>();

const remoteReactionName = ref('');

function chosen(emoji: string) {
	emit('done', emoji);
	if (props.choseAndClose) {
		modal.value?.close();
	}
}

function opening() {
	picker.value?.reset();
	picker.value?.focus();

	// 何故かちょっと待たないとフォーカスされない
	setTimeout(() => {
		picker.value?.focus();
	}, 10);
}
</script>

<style lang="scss" module>
.drawer {
	border-radius: 24px;
	border-bottom-right-radius: 0;
	border-bottom-left-radius: 0;
}

.remoteReactionInputWrapper {
	margin-top: var(--margin);
	padding: 16px;
	border-radius: var(--radius);
	background: var(--popup);
}

.emojiContainer {
	height: 48px;
	width: 48px;
}
</style>
