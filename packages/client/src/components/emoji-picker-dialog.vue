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
		:class="{ drawer: type === 'drawer', hasPadding: !isFocused }"
		:show-pinned="showPinned"
		:as-reaction-picker="asReactionPicker"
		:as-drawer="type === 'drawer'"
		:max-height="maxHeight"
		@chosen="chosen"
		@focused="focused"
	/>
</MkModal>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import MkModal from '@/components/ui/modal.vue';
import MkEmojiPicker from '@/components/emoji-picker.vue';
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

const modal = ref<InstanceType<typeof MkModal>>();
const picker = ref<InstanceType<typeof MkEmojiPicker>>();
const isFocused = ref(false);

function chosen(emoji: any) {
	emit('done', emoji);
	modal.value?.close();
}

function opening() {
	picker.value?.reset();
	picker.value?.focus();
}

function focused(v: boolean): void {
	isFocused.value = v;
}
</script>

<style lang="scss" scoped>
.ryghynhb {
	&.drawer {
		border-radius: 24px;
		border-bottom-right-radius: 0;
		border-bottom-left-radius: 0;

		&.hasPadding {
			padding-bottom: env(safe-area-inset-bottom);
		}
	}
}
</style>
