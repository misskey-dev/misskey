<template>
<!-- eslint-disable vue/no-mutating-props -->
<XContainer :draggable="true" @remove="() => $emit('remove')">
	<template #header><i class="fas fa-sticky-note"></i> {{ value.title }}</template>
	<template #func>
		<button class="_button" @click="rename()">
			<i class="fas fa-pencil-alt"></i>
		</button>
		<button class="_button" @click="add()">
			<i class="fas fa-plus"></i>
		</button>
	</template>

	<section class="ilrvjyvi">
		<XBlocks v-model="value.children" class="children" :hpml="hpml"/>
	</section>
</XContainer>
</template>

<script lang="ts" setup>
/* eslint-disable vue/no-mutating-props */
import { defineAsyncComponent, inject, onMounted } from 'vue';
import { v4 as uuid } from 'uuid';
import XContainer from '../page-editor.container.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';

const XBlocks = defineAsyncComponent(() => import('../page-editor.blocks.vue'));

const props = withDefaults(defineProps<{
	value: any,
	hpml: any
}>(), {
	value: {
		title: null,
		children: []
	}
});

const getPageBlockList = inject<(any) => any>('getPageBlockList');

async function rename() {
	const { canceled, result: title } = await os.inputText({
		title: 'Enter title',
		default: props.value.title
	});
	if (canceled) return;
	props.value.title = title;
}

async function add() {
	const { canceled, result: type } = await os.select({
		title: i18n.ts._pages.chooseBlock,
		groupedItems: getPageBlockList()
	});
	if (canceled) return;

	const id = uuid();
	props.value.children.push({ id, type });
}

onMounted(() => {
	if (props.value.title == null) {
		rename();
	}
});
</script>

<style lang="scss" scoped>
.ilrvjyvi {
	> .children {
		padding: 16px;
	}
}
</style>
