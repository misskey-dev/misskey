<template>
<div :class="$style.root">
	<div class="_gaps">
		<MkFolder>
			<template #icon><i class="ti ti-search"></i></template>
			<template #label>検索設定</template>
			<template #caption>
				検索条件を詳細に設定します。
			</template>

			<div class="_gaps">
				<div :class="[[spMode ? $style.searchAreaSp : $style.searchArea]]">
					<MkInput
						v-model="queryName"
						:debounce="true"
						type="search"
						autocapitalize="off"
						class="col1 row1"
						@enter="onSearchRequest"
					>
						<template #label>name</template>
					</MkInput>
					<MkInput
						v-model="queryHost"
						:debounce="true"
						type="search"
						autocapitalize="off"
						class="col2 row1"
						@enter="onSearchRequest"
					>
						<template #label>host</template>
					</MkInput>
					<MkInput
						v-model="queryUri"
						:debounce="true"
						type="search"
						autocapitalize="off"
						class="col1 row2"
						@enter="onSearchRequest"
					>
						<template #label>uri</template>
					</MkInput>
					<MkInput
						v-model="queryPublicUrl"
						:debounce="true"
						type="search"
						autocapitalize="off"
						class="col2 row2"
						@enter="onSearchRequest"
					>
						<template #label>publicUrl</template>
					</MkInput>
				</div>

				<MkFolder :spacerMax="8" :spacerMin="8">
					<template #icon><i class="ti ti-arrows-sort"></i></template>
					<template #label>ソート順</template>
					<div :class="$style.sortOrderArea">
						<div :class="$style.sortOrderAreaTags">
							<MkTagItem
								v-for="order in sortOrders"
								:key="order.key"
								:iconClass="order.direction === 'ASC' ? 'ti ti-arrow-up' : 'ti ti-arrow-down'"
								:exButtonIconClass="'ti ti-x'"
								:content="order.key"
								@click="onToggleSortOrderButtonClicked(order)"
								@exButtonClick="onRemoveSortOrderButtonClicked(order.key)"
							/>
						</div>
						<MkButton :class="$style.sortOrderAddButton" @click="onAddSortOrderButtonClicked">
							<span class="ti ti-plus"/>
						</MkButton>
					</div>
				</MkFolder>

				<div :class="[[spMode ? $style.searchButtonsSp : $style.searchButtons]]">
					<MkButton primary @click="onSearchRequest">
						{{ i18n.ts.search }}
					</MkButton>
					<MkButton @click="onQueryResetButtonClicked">
						リセット
					</MkButton>
				</div>
			</div>
		</MkFolder>

		<MkFolder>
			<template #icon><i class="ti ti-notes"></i></template>
			<template #label>登録ログ</template>
			<template #caption>
				絵文字更新・削除時のログが表示されます。更新・削除操作を行ったり、ページをリロードすると消えます。
			</template>

			<XRegisterLogs :logs="requestLogs"/>
		</MkFolder>

		<div v-if="gridItems.length > 0" :class="$style.gridArea">
			<MkGrid :data="gridItems" :settings="setupGrid()" @event="onGridEvent"/>
		</div>

		<MkPagingButtons :current="currentPage" :max="allPages" :buttonCount="5" @pageChanged="onPageChanged"/>

		<div v-if="gridItems.length > 0" class="_gaps" :class="$style.buttons">
			<MkButton primary @click="onImportClicked">チェックがついた絵文字をインポート</MkButton>
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
import { emptyStrToUndefined, RequestLogItem } from '@/pages/admin/custom-emojis-manager.impl.js';
import { GridCellValueChangeEvent, GridContext, GridEvent, GridKeyDownEvent } from '@/components/grid/grid-event.js';
import MkFolder from '@/components/MkFolder.vue';
import XRegisterLogs from '@/pages/admin/custom-emojis-manager.logs.vue';
import * as os from '@/os.js';
import { GridSetting } from '@/components/grid/grid.js';
import MkTagItem from '@/components/MkTagItem.vue';
import { deviceKind } from '@/scripts/device-kind.js';
import { MenuItem } from '@/types/menu.js';
import MkPagingButtons from '@/components/MkPagingButtons.vue';

type GridItem = {
	checked: boolean;
	id: string;
	url: string;
	name: string;
	host: string;
}

const gridSortOrderKeys = [
	'name',
	'host',
	'uri',
	'publicUrl',
];
type GridSortOrderKey = typeof gridSortOrderKeys[number];

type GridSortOrder = {
	key: GridSortOrderKey;
	direction: 'ASC' | 'DESC';
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
			{ bindTo: 'uri', title: 'uri', type: 'text', editable: false, width: 'auto' },
			{ bindTo: 'publicUrl', title: 'publicUrl', type: 'text', editable: false, width: 'auto' },
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

const customEmojis = ref<Misskey.entities.EmojiDetailedAdmin[]>([]);
const allPages = ref<number>(0);
const currentPage = ref<number>(0);

const queryName = ref<string | null>(null);
const queryHost = ref<string | null>(null);
const queryUri = ref<string | null>(null);
const queryPublicUrl = ref<string | null>(null);
const previousQuery = ref<string | undefined>(undefined);
const sortOrders = ref<GridSortOrder[]>([]);
const requestLogs = ref<RequestLogItem[]>([]);

const gridItems = ref<GridItem[]>([]);

const spMode = computed(() => ['smartphone', 'tablet'].includes(deviceKind));

function onToggleSortOrderButtonClicked(order: GridSortOrder) {
	switch (order.direction) {
		case 'ASC':
			order.direction = 'DESC';
			break;
		case 'DESC':
			order.direction = 'ASC';
			break;
	}
}

function onRemoveSortOrderButtonClicked(key: GridSortOrderKey) {
	sortOrders.value = sortOrders.value.filter(it => it.key !== key);
}

function onAddSortOrderButtonClicked(ev: MouseEvent) {
	const menuItems: MenuItem[] = gridSortOrderKeys
		.filter(key => !sortOrders.value.map(it => it.key).includes(key))
		.map(it => {
			return {
				text: it,
				action: () => {
					sortOrders.value.push({ key: it, direction: 'ASC' });
				},
			};
		});
	os.contextMenu(menuItems, ev);
}

async function onSearchRequest() {
	await refreshCustomEmojis();
}

function onQueryResetButtonClicked() {
	queryName.value = null;
	queryHost.value = null;
	queryUri.value = null;
	queryPublicUrl.value = null;
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

async function refreshCustomEmojis() {
	const query: Misskey.entities.AdminEmojiV2ListRequest['query'] = {
		name: emptyStrToUndefined(queryName.value),
		host: emptyStrToUndefined(queryHost.value),
		uri: emptyStrToUndefined(queryUri.value),
		publicUrl: emptyStrToUndefined(queryPublicUrl.value),
		hostType: 'remote',
	};

	if (JSON.stringify(query) !== previousQuery.value) {
		currentPage.value = 1;
	}

	const result = await os.promiseDialog(
		misskeyApi('admin/emoji/v2/list', {
			limit: 100,
			query: query,
			page: currentPage.value,
			sort: sortOrders.value.map(({ key, direction }) => ({ key: key as any, direction })),
		}),
		() => {
		},
		() => {
		},
	);

	customEmojis.value = result.emojis;
	allPages.value = result.allPages;
	previousQuery.value = JSON.stringify(query);
	gridItems.value = customEmojis.value.map(it => ({
		checked: false,
		id: it.id,
		url: it.publicUrl,
		name: it.name,
		host: it.host!,
	}));
}

onMounted(async () => {
	await refreshCustomEmojis();
});
</script>

<style lang="scss">
.row1 {
	grid-row: 1 / 2;
}

.row2 {
	grid-row: 2 / 3;
}

.col1 {
	grid-column: 1 / 2;
}

.col2 {
	grid-column: 2 / 3;
}

</style>

<style module lang="scss">

.root {
	--stickyTop: 0px;

	padding: 16px;
	overflow: scroll;
}

.searchArea {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 16px;
}

.searchButtons {
	display: flex;
	justify-content: flex-end;
	align-items: flex-end;
	gap: 8px;
}

.searchButtonsSp {
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 8px;
}

.searchAreaSp {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.sortOrderArea {
	display: flex;
	flex-direction: row;
	align-items: flex-start;
	justify-content: flex-start;
}

.sortOrderAreaTags {
	display: flex;
	flex-direction: row;
	align-items: flex-start;
	justify-content: flex-start;
	flex-wrap: wrap;
	gap: 8px;
}

.sortOrderAddButton {
	display: flex;
	justify-content: center;
	align-items: center;
	box-sizing: border-box;
	min-width: 2.0em;
	min-height: 2.0em;
	max-width: 2.0em;
	max-height: 2.0em;
	padding: 8px;
	margin-left: auto;
	border-radius: 9999px;
	background-color: var(--buttonBg);
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
