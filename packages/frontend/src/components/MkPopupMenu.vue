<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModal ref="modal" v-slot="{ type, maxHeight }" :zPriority="'high'" :src="src" :transparentBg="true" @click="close" @close="emit('closing')" @closed="emit('closed')">
	<MkMenu :items="items" :align="align" :width="width" :max-height="maxHeight" :asDrawer="type === 'drawer'" :class="{ [$style.drawer]: type === 'drawer' }" @close="close" @hide="manualShowing = false"/>
</MkModal>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
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
const manualShowing = ref(true);

function close() {
	if (!modal) return;
	manualShowing.value = false;
	modal.close();
}
</script>

<style lang="scss" module>
.drawer {
	border-radius: 24px;
	border-bottom-right-radius: 0;
	border-bottom-left-radius: 0;
}
</style>
