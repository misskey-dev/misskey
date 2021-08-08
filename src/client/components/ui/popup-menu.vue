<template>
<MkPopup ref="popup" :src="src" @closed="$emit('closed')">
	<MkMenu :items="items" :align="align" @close="$refs.popup.close()" class="_popup" style="box-shadow: 0 8px 32px rgb(0 0 0 / 30%);"/>
</MkPopup>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkPopup from './popup.vue';
import MkMenu from './menu.vue';

export default defineComponent({
	components: {
		MkPopup,
		MkMenu,
	},

	props: {
		showing: {
			type: Boolean,
			required: true,
		},
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

	emits: ['close', 'closed'],
});
</script>
