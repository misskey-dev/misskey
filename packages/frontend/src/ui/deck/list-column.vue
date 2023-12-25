<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<XColumn :menu="menu" :column="column" :isStacked="isStacked" :refresher="() => timeline.reloadTimeline()">
	<template #header>
		<i class="ti ti-list"></i><span style="margin-left: 8px;">{{ column.name }}</span>
	</template>

	<MkTimeline v-if="column.listId" ref="timeline" src="list" :list="column.listId" :withRenotes="withRenotes"/>
</XColumn>
</template>

<script lang="ts" setup>
import { watch, shallowRef, ref } from 'vue';
import XColumn from './column.vue';
import { updateColumn, Column } from './deck-store.js';
import MkTimeline from '@/components/MkTimeline.vue';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';

const props = defineProps<{
	column: Column;
	isStacked: boolean;
}>();

const timeline = shallowRef<InstanceType<typeof MkTimeline>>();
const withRenotes = ref(props.column.withRenotes ?? true);

if (props.column.listId == null) {
	setList();
}

watch(withRenotes, v => {
	updateColumn(props.column.id, {
		withRenotes: v,
	});
});

async function setList() {
	const lists = await os.api('users/lists/list');
	const { canceled, result: list } = await os.select({
		title: i18n.ts.selectList,
		items: lists.map(x => ({
			value: x, text: x.name,
		})),
		default: props.column.listId,
	});
	if (canceled) return;
	updateColumn(props.column.id, {
		listId: list.id,
	});
}

function editList() {
	os.pageWindow('my/lists/' + props.column.listId);
}

const menu = [
	{
		icon: 'ti ti-pencil',
		text: i18n.ts.selectList,
		action: setList,
	},
	{
		icon: 'ti ti-settings',
		text: i18n.ts.editList,
		action: editList,
	},
	{
		type: 'switch',
		text: i18n.ts.showRenotes,
		ref: withRenotes,
	},
];
</script>
