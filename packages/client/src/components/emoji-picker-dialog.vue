<template>
<MkModal ref="modal" v-slot="{ type, maxHeight }" :z-priority="'middle'" :prefer-type="asReactionPicker && $store.state.reactionPickerUseDrawerForMobile === false ? 'popup' : 'auto'" :transparent-bg="true" :manual-showing="manualShowing" :src="src" @click="$refs.modal.close()" @opening="opening" @close="$emit('close')" @closed="$emit('closed')">
	<MkEmojiPicker ref="picker" class="ryghynhb _popup _shadow" :class="{ drawer: type === 'drawer' }" :show-pinned="showPinned" :as-reaction-picker="asReactionPicker" :as-drawer="type === 'drawer'" :max-height="maxHeight" @chosen="chosen"/>
</MkModal>
</template>

<script lang="ts">
import { defineComponent, markRaw } from 'vue';
import MkModal from '@/components/ui/modal.vue';
import MkEmojiPicker from '@/components/emoji-picker.vue';

export default defineComponent({
	components: {
		MkModal,
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
			this.$refs.modal.close();
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
	&.drawer {
		border-radius: 24px;
		border-bottom-right-radius: 0;
		border-bottom-left-radius: 0;
	}
}
</style>
