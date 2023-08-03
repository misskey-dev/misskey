<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModal ref="modal" v-slot="{ type, maxHeight }" :manualShowing="manualShowing" :zPriority="'high'" :src="src" :transparentBg="true" @click="click" @close="onModalClose" @closed="closed">
	<MkMenu :items="items" :align="align" :width="width" :max-height="maxHeight" :asDrawer="type === 'drawer'" :class="{ [$style.drawer]: type === 'drawer' }" @close="onMenuClose" @hide="manualShowing = false"/>
</MkModal>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import MkModal from './MkModal.vue';
import MkMenu from './MkMenu.vue';
import { MenuItem } from '@/types/menu';

const props = defineProps<{
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

console.log('popup menu modal setup', props.items);

let modal = $shallowRef<InstanceType<typeof MkModal>>();
const manualShowing = ref(true);

function click() {
	console.log('popup menu modal click', props.items);
	close();
}

function onModalClose() {
	console.log('popup menu modal close', props.items);
	emit('closing');
}

function onMenuClose() {
	console.log('popup menu menu click', props.items);
	close();
}

function closed() {
	console.log('popup menu modal closed', props.items);
	emit('closed');
}

function close() {
	console.log('popup menu close', props.items);
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
