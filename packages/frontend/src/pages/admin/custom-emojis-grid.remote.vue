<template>
<div class="_gaps" :class="$style.root">
	<div :class="$style.searchArea">
		<MkInput v-model="query" :debounce="true" type="search" autocapitalize="off" style="flex: 1">
			<template #prefix><i class="ti ti-search"></i></template>
			<template #label>絵文字名</template>
		</MkInput>
		<MkInput v-model="host" :debounce="true" type="search" autocapitalize="off" style="flex: 1">
			<template #prefix><i class="ti ti-cloud-network"></i></template>
			<template #label>ホスト名</template>
		</MkInput>
		<MkButton primary style="margin-left: auto;" @click="onSearchButtonClicked">
			{{ i18n.ts.search }}
		</MkButton>
	</div>

	<div v-if="gridItems.length > 0">
		<div :class="$style.gridArea">
			<MkGrid :data="gridItems" :columnSettings="columnSettings" @event="onGridEvent"/>
		</div>

		<div class="_gaps">
			<div :class="$style.pages">
				<button @click="onLatestButtonClicked">&lt;</button>
				<button @click="onOldestButtonClicked">&gt;</button>
			</div>

			<div :class="$style.buttons">
				<MkButton primary @click="onImportClicked">チェックがついた絵文字をインポート</MkButton>
			</div>
		</div>
	</div>
</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import * as Misskey from 'misskey-js';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { i18n } from '@/i18n.js';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkGrid from '@/components/grid/MkGrid.vue';
import { ColumnSetting } from '@/components/grid/column.js';
import { fromEmojiDetailed, GridItem } from '@/pages/admin/custom-emojis-grid.impl.js';
import {
	GridCellContextMenuEvent,
	GridCellValueChangeEvent,
	GridCurrentState,
	GridEvent,
	GridKeyDownEvent,
	GridRowContextMenuEvent,
} from '@/components/grid/grid-event.js';
import { optInGridUtils } from '@/components/grid/optin-utils.js';

const columnSettings: ColumnSetting[] = [
	{ bindTo: 'checked', icon: 'ti-download', type: 'boolean', editable: true, width: 34 },
	{ bindTo: 'url', icon: 'ti-icons', type: 'image', editable: false, width: 'auto' },
	{ bindTo: 'name', title: 'name', type: 'text', editable: false, width: 'auto' },
	{ bindTo: 'host', title: 'host', type: 'text', editable: false, width: 'auto' },
];

const customEmojis = ref<Misskey.entities.EmojiDetailed[]>([]);
const gridItems = ref<GridItem[]>([]);
const query = ref<string>('');
const host = ref<string>('');

const latest = computed(() => customEmojis.value.length > 0 ? customEmojis.value[0]?.id : undefined);
const oldest = computed(() => customEmojis.value.length > 0 ? customEmojis.value[customEmojis.value.length - 1]?.id : undefined);

async function onSearchButtonClicked() {
	await refreshCustomEmojis(query.value, host.value);
}

async function onLatestButtonClicked() {
	await refreshCustomEmojis(query.value, host.value, undefined, latest.value);
}

async function onOldestButtonClicked() {
	await refreshCustomEmojis(query.value, host.value, oldest.value, undefined);
}

async function onImportClicked() {
	const targets = gridItems.value.filter(it => it.checked);
	await importEmojis(targets);
}

function onGridEvent(event: GridEvent, currentState: GridCurrentState) {
	switch (event.type) {
		case 'row-context-menu':
			onGridRowContextMenu(event, currentState);
			break;
		case 'cell-context-menu':
			onGridCellContextMenu(event, currentState);
			break;
		case 'cell-value-change':
			onGridCellValueChange(event, currentState);
			break;
		case 'keydown':
			onGridKeyDown(event, currentState);
			break;
	}
}

function onGridRowContextMenu(event: GridRowContextMenuEvent, currentState: GridCurrentState) {
	event.menuItems.push(
		{
			type: 'button',
			text: '選択行をインポート',
			icon: 'ti ti-download',
			action: async () => {
				const targets = currentState.rangedRows.map(it => gridItems.value[it.index]);
				console.log(targets);
				await importEmojis(targets);
			},
		},
	);
}

function onGridCellContextMenu(event: GridCellContextMenuEvent, currentState: GridCurrentState) {
	event.menuItems.push(
		{
			type: 'button',
			text: '選択された絵文字をインポート',
			icon: 'ti ti-download',
			action: async () => {
				const targets = [...new Set(currentState.rangedCells.map(it => it.row)).values()].map(it => gridItems.value[it.index]);
				await importEmojis(targets);
			},
		},
	);
}

function onGridCellValueChange(event: GridCellValueChangeEvent, currentState: GridCurrentState) {
	const { row, column, newValue } = event;
	if (gridItems.value.length > row.index && column.setting.bindTo in gridItems.value[row.index]) {
		gridItems.value[row.index][column.setting.bindTo] = newValue;
	}
}

function onGridKeyDown(event: GridKeyDownEvent, currentState: GridCurrentState) {
	optInGridUtils.defaultKeyDownHandler(gridItems, event, currentState);
}

async function importEmojis(targets: GridItem[]) {
	async function action() {
		for (const target of targets) {
			await misskeyApi('admin/emoji/copy', {
				emojiId: target.id!,
			});
		}

		await refreshCustomEmojis(query.value, host.value);
	}

	const confirm = await os.confirm({
		type: 'info',
		title: '絵文字のインポート',
		text: `リモートから受信した${targets.length}個の絵文字のインポートを行います。絵文字のライセンスに十分な注意を払ってください。インポートを行いますか？`,
	});

	if (!confirm.canceled) {
		await os.promiseDialog(
			action(),
			() => {
			},
			() => {
			},
		);
	}
}

async function refreshCustomEmojis(query?: string, host?: string, sinceId?: string, untilId?: string) {
	const emojis = await misskeyApi('admin/emoji/list-remote', {
		limit: 100,
		query: query?.length ? query : undefined,
		host: host?.length ? host : undefined,
		sinceId,
		untilId,
	});

	if (sinceId) {
		// 通常はID降順だが、sinceIdを設定すると昇順での並び替えとなるので、逆順にする必要がある
		emojis.reverse();
	}

	customEmojis.value = emojis;
	console.log(customEmojis.value);
	gridItems.value = customEmojis.value.map(it => fromEmojiDetailed(it));
}

onMounted(async () => {
	await refreshCustomEmojis();
});
</script>

<style lang="scss">
.emoji-grid-row-edited {
	background-color: var(--ag-advanced-filter-column-pill-color);
}

.emoji-grid-item-image {
	width: auto;
	height: 26px;
	max-width: 100%;
	max-height: 100%;
}
</style>

<style module lang="scss">
.root {
	padding: 16px;
	overflow: scroll;
}

.searchArea {
	display: flex;
	flex-direction: row;
	align-items: flex-end;
	justify-content: stretch;
	gap: 8px;
}

.gridArea {
	overflow: scroll;
	padding-top: 8px;
	padding-bottom: 8px;
	resize: vertical;
}

.pages {
	display: flex;
	justify-content: center;
	align-items: center;

	button {
		background-color: var(--buttonBg);
		border-radius: 9999px;
		border: none;
		margin: 0 4px;
		padding: 8px;
	}
}

.buttons {
	display: inline-flex;
	margin-left: auto;
	gap: 8px;
	flex-wrap: wrap;
}
</style>
