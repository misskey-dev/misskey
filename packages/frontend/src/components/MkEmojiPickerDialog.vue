<template>
<MkModal
	ref="modal"
	v-slot="{ type, maxHeight }"
	:z-priority="'middle'"
	:prefer-type="asReactionPicker && defaultStore.state.reactionPickerUseDrawerForMobile === false ? 'popup' : 'auto'"
	:transparent-bg="true"
	:manual-showing="manualShowing"
	:src="src"
	@click="modal?.close()"
	@opening="opening"
	@close="emit('close')"
	@closed="emit('closed')"
>
	<MkEmojiPicker
		ref="picker"
		class="ryghynhb _popup _shadow"
		:class="{ drawer: type === 'drawer' }"
		:show-pinned="showPinned"
		:as-reaction-picker="asReactionPicker"
		:as-drawer="type === 'drawer'"
		:max-height="maxHeight"
		@chosen="chosen"
	/>
</MkModal>
</template>

<script lang="ts" setup>
import { shallowRef } from 'vue';
import MkModal from '@/components/MkModal.vue';
import MkEmojiPicker from '@/components/MkEmojiPicker.vue';
import { defaultStore } from '@/store';

withDefaults(defineProps<{
	manualShowing?: boolean | null;
	src?: HTMLElement;
	showPinned?: boolean;
	asReactionPicker?: boolean;
}>(), {
	manualShowing: null,
	showPinned: true,
	asReactionPicker: false,
});

const emit = defineEmits<{
	(ev: 'done', v: any): void;
	(ev: 'close'): void;
	(ev: 'closed'): void;
}>();

const modal = shallowRef<InstanceType<typeof MkModal>>();
const picker = shallowRef<InstanceType<typeof MkEmojiPicker>>();

function chosen(emoji: any) {
	emit('done', emoji);
	modal.value?.close();
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

<style lang="scss" scoped>
.ryghynhb {
	&.drawer {
		border-radius: 24px;
		border-bottom-right-radius: 0;
		border-bottom-left-radius: 0;
	}
}
</style>
