<template>
<MkModal ref="modal" v-slot="{ type, maxHeight }" :z-priority="'high'" :src="src" :transparent-bg="true" @click="$refs.modal.close()" @closed="$emit('closed')">
	<MkMenu :items="items" :align="align" :width="width" :max-height="maxHeight" :as-drawer="type === 'drawer'" class="sfhdhdhq _popup _shadow" :class="{ drawer: type === 'drawer' }" @close="$refs.modal.close()"/>
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
		width: {
			type: Number,
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

<style lang="scss" scoped>
.sfhdhdhq {
	&.drawer {
		border-radius: 24px;
		border-bottom-right-radius: 0;
		border-bottom-left-radius: 0;
	}
}
</style>
