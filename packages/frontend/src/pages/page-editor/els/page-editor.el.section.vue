<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<!-- eslint-disable vue/no-mutating-props -->
<XContainer :draggable="true" @remove="() => emit('remove')">
	<template #header><i class="ti ti-note"></i> {{ props.modelValue.title }}</template>
	<template #func>
		<button class="_button" @click="rename()">
			<i class="ti ti-pencil"></i>
		</button>
	</template>

	<section class="ilrvjyvi">
		<XBlocks v-model="children" class="children"/>
		<MkButton rounded class="add" @click="add()"><i class="ti ti-plus"></i></MkButton>
	</section>
</XContainer>
</template>

<script lang="ts" setup>

import { defineAsyncComponent, inject, onMounted, watch, ref } from 'vue';
import * as Misskey from 'misskey-js';
import XContainer from '../page-editor.container.vue';
import { genId } from '@/utility/id.js';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { deepClone } from '@/utility/clone.js';
import MkButton from '@/components/MkButton.vue';
import { getPageBlockList } from '@/pages/page-editor/common.js';

const XBlocks = defineAsyncComponent(() => import('../page-editor.blocks.vue'));

const props = defineProps<{
	modelValue: Extract<Misskey.entities.PageBlock, { type: 'section'; }>,
}>();

const emit = defineEmits<{
	(ev: 'update:modelValue', value: Extract<Misskey.entities.PageBlock, { type: 'section'; }>): void;
	(ev: 'remove'): void;
}>();

const children = ref(deepClone(props.modelValue.children ?? []));

watch(children, () => {
	emit('update:modelValue', {
		...props.modelValue,
		children: children.value,
	});
}, {
	deep: true,
});

async function rename() {
	const { canceled, result: title } = await os.inputText({
		title: i18n.ts._pages.enterSectionTitle,
		default: props.modelValue.title,
	});
	if (canceled || title == null) return;
	emit('update:modelValue', {
		...props.modelValue,
		title,
	});
}

async function add() {
	const { canceled, result: type } = await os.select({
		title: i18n.ts._pages.chooseBlock,
		items: getPageBlockList(),
	});
	if (canceled || type == null) return;

	const id = genId();

	// TODO: page-editor.vueのと共通化
	if (type === 'text') {
		children.value.push({
			id,
			type,
			text: '',
		});
	} else if (type === 'section') {
		children.value.push({
			id,
			type,
			title: '',
			children: [],
		});
	} else if (type === 'image') {
		children.value.push({
			id,
			type,
			fileId: null,
		});
	} else if (type === 'note') {
		children.value.push({
			id,
			type,
			detailed: false,
			note: null,
		});
	}
}

onMounted(() => {
	if (props.modelValue.title == null) {
		rename();
	}
});
</script>

<style lang="scss" scoped>
.ilrvjyvi {
	> .children {
		margin: 16px;

		&:empty {
			display: none;
		}
	}

	> .add {
		margin: 16px auto;
	}
}
</style>
