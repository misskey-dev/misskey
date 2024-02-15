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

	<MkFolder>
		<template #icon><i class="ti ti-notes"></i></template>
		<template #label>登録ログ</template>
		<template #caption>
			絵文字更新・削除時のログが表示されます。更新・削除操作を行ったり、ページをリロードすると消えます。
		</template>

		<XRegisterLogs :logs="requestLogs"/>
	</MkFolder>

	<div v-if="gridItems.length > 0">
		<div :class="$style.gridArea">
			<MkGrid :data="gridItems" :settings="setupGrid()" @event="onGridEvent"/>
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
import { misskeyApi } from '@/scripts/misskey-api.js';
import { i18n } from '@/i18n.js';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkGrid from '@/components/grid/MkGrid.vue';
import { RequestLogItem } from '@/pages/admin/custom-emojis-grid.impl.js';
import { GridCellValueChangeEvent, GridContext, GridEvent, GridKeyDownEvent } from '@/components/grid/grid-event.js';
import { optInGridUtils } from '@/components/grid/optin-utils.js';
import MkFolder from '@/components/MkFolder.vue';
import XRegisterLogs from '@/pages/admin/custom-emojis-grid.local.logs.vue';
import * as os from '@/os.js';
import { GridSetting } from '@/components/grid/grid.js';

type GridItem = {
	checked: boolean;
	id: string;
	url: string;
	name: string;
	host: string;
}

function setupGrid(): GridSetting {
	return {
		row: {
			contextMenuFactory: (row, context) => {
				return [
					{
						type: 'button',
						text: '選択行をインポート',
						icon: 'ti ti-download',
						action: async () => {
							const targets = context.rangedRows.map(it => gridItems.value[it.index]);
							await importEmojis(targets);
						},
					},
				];
			},
		},
		cols: [
			{ bindTo: 'checked', icon: 'ti-download', type: 'boolean', editable: true, width: 34 },
			{ bindTo: 'url', icon: 'ti-icons', type: 'image', editable: false, width: 'auto' },
			{ bindTo: 'name', title: 'name', type: 'text', editable: false, width: 'auto' },
			{ bindTo: 'host', title: 'host', type: 'text', editable: false, width: 'auto' },
		],
		cells: {
			contextMenuFactory: (col, row, value, context) => {
				return [
					{
						type: 'button',
						text: '選択範囲の行をインポート',
						icon: 'ti ti-download',
						action: async () => {
							const targets = context.rangedCells.map(it => gridItems.value[it.row.index]);
							await importEmojis(targets);
						},
					},
				];
			},
		},
	};
}

const requestLogs = ref<RequestLogItem[]>([]);

const customEmojis = ref<Misskey.entities.EmojiDetailedAdmin[]>([]);
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

function onGridEvent(event: GridEvent, currentState: GridContext) {
	switch (event.type) {
		case 'cell-value-change':
			onGridCellValueChange(event);
			break;
		case 'keydown':
			onGridKeyDown(event, currentState);
			break;
	}
}

function onGridCellValueChange(event: GridCellValueChangeEvent) {
	const { row, column, newValue } = event;
	if (gridItems.value.length > row.index && column.setting.bindTo in gridItems.value[row.index]) {
		gridItems.value[row.index][column.setting.bindTo] = newValue;
	}
}

function onGridKeyDown(event: GridKeyDownEvent, currentState: GridContext) {
	optInGridUtils.defaultKeyDownHandler(gridItems, event, currentState);
}

async function importEmojis(targets: GridItem[]) {
	const action = () => {
		return targets.map(item =>
			misskeyApi(
				'admin/emoji/copy',
				{
					emojiId: item.id!,
				})
				.then(() => ({ item, success: true, err: undefined }))
				.catch(err => ({ item, success: false, err })),
		);
	};

	const confirm = await os.confirm({
		type: 'info',
		title: '絵文字のインポート',
		text: `リモートから受信した${targets.length}個の絵文字のインポートを行います。絵文字のライセンスに十分な注意を払ってください。実行しますか？`,
	});

	if (confirm.canceled) {
		return;
	}

	const result = await os.promiseDialog(Promise.all(action()));
	const failedItems = result.filter(it => !it.success);

	if (failedItems.length > 0) {
		await os.alert({
			type: 'error',
			title: 'エラー',
			text: '絵文字の更新・削除に失敗しました。詳細は登録ログをご確認ください。',
		});
	}

	requestLogs.value = result.map(it => ({
		failed: !it.success,
		url: it.item.url,
		name: it.item.name,
		error: it.err ? JSON.stringify(it.err) : undefined,
	}));

	await refreshCustomEmojis();
}

async function refreshCustomEmojis(query?: string, host?: string, sinceId?: string, untilId?: string) {
	const emojis = await misskeyApi('admin/emoji/v2/list', {
		limit: 100,
		query: {
			name: query,
			host: host,
			sinceId: sinceId,
			untilId: untilId,
			hostType: 'remote',
		},
	});

	customEmojis.value = emojis.emojis;
	gridItems.value = customEmojis.value.map(it => ({
		checked: false,
		id: it.id,
		url: it.uri!,
		name: it.name,
		host: it.host!,
	}));
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
