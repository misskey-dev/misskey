<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkDraggable
	:modelValue="modelValue"
	direction="vertical"
	withGaps
	canNest
	group="pageBlocks"
	@update:modelValue="v => emit('update:modelValue', v)"
>
	<template #default="{ item }">
		<div>
			<!-- divが無いとエラーになる https://github.com/SortableJS/vue.draggable.next/issues/189 -->
			<component :is="getComponent(item.type) as any" :modelValue="item" @update:modelValue="updateItem" @remove="() => removeItem(item)"/>
		</div>
	</template>
</MkDraggable>
</template>

<script lang="ts" setup>
import * as Misskey from 'misskey-js';
import XSection from './els/page-editor.el.section.vue';
import XText from './els/page-editor.el.text.vue';
import XImage from './els/page-editor.el.image.vue';
import XNote from './els/page-editor.el.note.vue';
import MkDraggable from '@/components/MkDraggable.vue';

function getComponent(type: Misskey.entities.Page['content'][number]['type']) {
	switch (type) {
		case 'section': return XSection;
		case 'text': return XText;
		case 'image': return XImage;
		case 'note': return XNote;
		default: return XText;
	}
}

const props = defineProps<{
	modelValue: Misskey.entities.Page['content'];
}>();

const emit = defineEmits<{
	(ev: 'update:modelValue', value: Misskey.entities.Page['content']): void;
}>();

function updateItem(v: Misskey.entities.PageBlock) {
	const i = props.modelValue.findIndex(x => x.id === v.id);
	const newValue = [
		...props.modelValue.slice(0, i),
		v,
		...props.modelValue.slice(i + 1),
	];
	emit('update:modelValue', newValue);
}

function removeItem(v: Misskey.entities.PageBlock) {
	const i = props.modelValue.findIndex(x => x.id === v.id);
	const newValue = [
		...props.modelValue.slice(0, i),
		...props.modelValue.slice(i + 1),
	];
	emit('update:modelValue', newValue);
}
</script>
