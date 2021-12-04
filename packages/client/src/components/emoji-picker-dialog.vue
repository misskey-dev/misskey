<template>
<MkPopup ref="popup" v-slot="{ point, close }" :manual-showing="manualShowing" :src="src" :front="true" @click="close()" @opening="opening" @close="$emit('close')" @closed="$emit('closed')">
	<MkEmojiPicker ref="picker" class="ryghynhb _popup _shadow" :class="{ pointer: point === 'top' }" :show-pinned="showPinned" :as-reaction-picker="asReactionPicker" @chosen="chosen"/>
</MkPopup>
</template>

<script lang="ts">
import { defineComponent, markRaw } from 'vue';
import MkPopup from '@/components/ui/popup.vue';
import MkEmojiPicker from '@/components/emoji-picker.vue';

export default defineComponent({
	components: {
		MkPopup,
		MkEmojiPicker,
	},

	props: {
		manualShowing: {
			type: Boolean,
			required: false,
			default: null,
		},
		src: {
			required: false
		},
		showPinned: {
			required: false,
			default: true
		},
		asReactionPicker: {
			required: false
		},
	},

	emits: ['done', 'close', 'closed'],

	data() {
		return {

		};
	},

	methods: {
		chosen(emoji: any) {
			this.$emit('done', emoji);
			this.$refs.popup.close();
		},

		opening() {
			this.$refs.picker.reset();
			this.$refs.picker.focus();
		}
	}
});
</script>

<style lang="scss" scoped>
.ryghynhb {
	&.pointer {
		&:before {
			--size: 8px;
			content: '';
			display: block;
			position: absolute;
			top: calc(0px - (var(--size) * 2));
			left: 0;
			right: 0;
			width: 0;
			margin: auto;
			border: solid var(--size) transparent;
			border-bottom-color: var(--popup);
		}
	}
}
</style>
