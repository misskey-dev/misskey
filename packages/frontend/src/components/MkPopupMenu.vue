<template>
<MkModal ref="modal" v-slot="{ type, maxHeight }" :z-priority="'high'" :src="src" :transparent-bg="true" @click="modal.close()" @close="emit('closing')" @closed="emit('closed')">
	<MkMenu :items="items" :align="align" :width="width" :max-height="maxHeight" :as-drawer="type === 'drawer'" :class="{ [$style.drawer]: type === 'drawer' }" @close="modal.close()"/>
</MkModal>
</template>

<script lang="ts" setup>
import { } from 'vue';
import MkModal from './MkModal.vue';
import MkMenu from './MkMenu.vue';
import { MenuItem } from '@/types/menu';

defineProps<{
	items: MenuItem[];
	align?: 'center' | string;
	width?: number;
	viaKeyboard?: boolean;
	src?: any;
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
	(ev: 'closing'): void;
}>();

let modal = $shallowRef<InstanceType<typeof MkModal>>();
</script>

<style lang="scss" module>
.drawer {
	border-radius: 24px;
	border-bottom-right-radius: 0;
	border-bottom-left-radius: 0;
}
</style>
