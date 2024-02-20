<template>
<div>
	<div v-if="logs.length > 0" style="display:flex; flex-direction: column; overflow-y: scroll; gap: 16px;">
		<MkSwitch v-model="showingSuccessLogs">
			<template #label>成功ログを表示する</template>
		</MkSwitch>
		<div>
			<div v-if="filteredLogs.length > 0">
				<MkGrid
					:data="filteredLogs"
					:settings="setupGrid()"
				/>
			</div>
			<div v-else>
				失敗ログはありません。
			</div>
		</div>
	</div>
	<div v-else>
		ログはありません。
	</div>
</div>
</template>

<script setup lang="ts">

import { computed, ref, toRefs } from 'vue';
import { RequestLogItem } from '@/pages/admin/custom-emojis-manager.impl.js';
import MkGrid from '@/components/grid/MkGrid.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import { GridSetting } from '@/components/grid/grid.js';
import { copyGridDataToClipboard } from '@/components/grid/grid-utils.js';

function setupGrid(): GridSetting {
	return {
		row: {
			showNumber: false,
			selectable: false,
			contextMenuFactory: (row, context) => {
				return [
					{
						type: 'button',
						text: '選択行をコピー',
						icon: 'ti ti-copy',
						action: () => copyGridDataToClipboard(logs, context),
					},
				];
			},
		},
		cols: [
			{ bindTo: 'failed', title: 'failed', type: 'boolean', editable: false, width: 50 },
			{ bindTo: 'url', icon: 'ti-icons', type: 'image', editable: false, width: 'auto' },
			{ bindTo: 'name', title: 'name', type: 'text', editable: false, width: 140 },
			{ bindTo: 'error', title: 'log', type: 'text', editable: false, width: 'auto' },
		],
		cells: {
			contextMenuFactory: (col, row, value, context) => {
				return [
					{
						type: 'button',
						text: '選択範囲をコピー',
						icon: 'ti ti-copy',
						action: () => copyGridDataToClipboard(logs, context),
					},
				];
			},
		},
	};
}

const props = defineProps<{
	logs: RequestLogItem[];
}>();

const { logs } = toRefs(props);
const showingSuccessLogs = ref<boolean>(false);

const filteredLogs = computed(() => {
	const forceShowing = showingSuccessLogs.value;
	return logs.value.filter((log) => forceShowing || log.failed);
});

</script>

<style module lang="scss">

</style>
