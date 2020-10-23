<template>
<MkModal ref="modal" :src="src" @click="$refs.modal.close()" @closed="$emit('closed')">
	<MkMenu :items="items" :align="align" @close="$refs.modal.close()" class="_popup"/>
</MkModal>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkModal from './modal.vue';
import MkMenu from './menu.vue';

export default defineComponent({
	components: {
		MkModal,
		MkMenu,
	},
	props: {
		items: {
			type: Array,
			required: true
		},
		align: {
			type: String,
			required: false
		},
		viaKeyboard: {
			type: Boolean,
			required: false
		},
		src: {
			required: false
		},
	},
	emits: ['closed'],
	computed: {
		keymap(): any {
			return {
				'esc': () => this.$refs.modal.close(),
			};
		},
	},
});
</script>

<style lang="scss" scoped>

</style>
