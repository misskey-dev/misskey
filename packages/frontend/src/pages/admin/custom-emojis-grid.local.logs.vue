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
					@event="onGridEvent"
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
import { RequestLogItem } from '@/pages/admin/custom-emojis-grid.impl.js';
import {
	GridContext,
	GridEvent,
	GridKeyDownEvent,
} from '@/components/grid/grid-event.js';
import { optInGridUtils } from '@/components/grid/optin-utils.js';
import MkGrid from '@/components/grid/MkGrid.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import { GridSetting } from '@/components/grid/grid.js';

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
						action: () => optInGridUtils.copyToClipboard(logs, context),
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
						action: () => optInGridUtils.copyToClipboard(logs, context),
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

function onGridEvent(event: GridEvent, currentState: GridContext) {
	switch (event.type) {
		case 'keydown':
			onGridKeyDown(event, currentState);
			break;
	}
}

function onGridKeyDown(event: GridKeyDownEvent, currentState: GridContext) {
	optInGridUtils.defaultKeyDownHandler(logs, event, currentState);
}

</script>

<style module lang="scss">

</style>
