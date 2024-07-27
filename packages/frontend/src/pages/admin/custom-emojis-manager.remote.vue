<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<div class="_gaps">
		<MkFolder>
			<template #icon><i class="ti ti-search"></i></template>
			<template #label>{{ i18n.ts._customEmojisManager._gridCommon.searchSettings }}</template>
			<template #caption>
				{{ i18n.ts._customEmojisManager._gridCommon.searchSettingCaption }}
			</template>

			<div class="_gaps">
				<div :class="[[spMode ? $style.searchAreaSp : $style.searchArea]]">
					<MkInput
						v-model="queryName"
						type="search"
						autocapitalize="off"
						:class="[$style.col1, $style.row1]"
						@enter="onSearchRequest"
					>
						<template #label>name</template>
					</MkInput>
					<MkInput
						v-model="queryHost"
						type="search"
						autocapitalize="off"
						:class="[$style.col2, $style.row1]"
						@enter="onSearchRequest"
					>
						<template #label>host</template>
					</MkInput>
					<MkInput
						v-model="queryUri"
						type="search"
						autocapitalize="off"
						:class="[$style.col1, $style.row2]"
						@enter="onSearchRequest"
					>
						<template #label>uri</template>
					</MkInput>
					<MkInput
						v-model="queryPublicUrl"
						type="search"
						autocapitalize="off"
						:class="[$style.col2, $style.row2]"
						@enter="onSearchRequest"
					>
						<template #label>publicUrl</template>
					</MkInput>
				</div>

				<MkFolder :spacerMax="8" :spacerMin="8">
					<template #icon><i class="ti ti-arrows-sort"></i></template>
					<template #label>{{ i18n.ts._customEmojisManager._gridCommon.sortOrder }}</template>
					<MkSortOrderEditor
						:baseOrderKeyNames="gridSortOrderKeys"
						:currentOrders="sortOrders"
						@update="onSortOrderUpdate"
					/>
				</MkFolder>

				<div :class="[[spMode ? $style.searchButtonsSp : $style.searchButtons]]">
					<MkButton primary @click="onSearchRequest">
						{{ i18n.ts.search }}
					</MkButton>
					<MkButton @click="onQueryResetButtonClicked">
						{{ i18n.ts.reset }}
					</MkButton>
				</div>
			</div>
		</MkFolder>

		<XRegisterLogsFolder :logs="requestLogs"/>

		<div v-if="gridItems.length > 0" :class="$style.gridArea">
			<MkGrid :data="gridItems" :settings="setupGrid()" @event="onGridEvent"/>
		</div>

		<MkPagingButtons :current="currentPage" :max="allPages" :buttonCount="5" @pageChanged="onPageChanged"/>

		<div v-if="gridItems.length > 0" class="_gaps" :class="$style.buttons">
			<MkButton primary @click="onImportClicked">
				{{
					i18n.ts._customEmojisManager._remote.importEmojisButton
				}}
			</MkButton>
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
import {
	emptyStrToUndefined,
	GridSortOrderKey,
	gridSortOrderKeys,
	RequestLogItem,
} from '@/pages/admin/custom-emojis-manager.impl.js';
import { GridCellValueChangeEvent, GridEvent } from '@/components/grid/grid-event.js';
import MkFolder from '@/components/MkFolder.vue';
import XRegisterLogsFolder from '@/pages/admin/custom-emojis-manager.logs-folder.vue';
import * as os from '@/os.js';
import { GridSetting } from '@/components/grid/grid.js';
import { deviceKind } from '@/scripts/device-kind.js';
import MkPagingButtons from '@/components/MkPagingButtons.vue';
import MkSortOrderEditor from '@/components/MkSortOrderEditor.vue';
import { SortOrder } from '@/components/MkSortOrderEditor.define.js';

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
						text: i18n.ts._customEmojisManager._remote.importSelectionRows,
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
						text: i18n.ts._customEmojisManager._remote.importSelectionRangesRows,
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
const sortOrders = ref<SortOrder<GridSortOrderKey>[]>([]);
const requestLogs = ref<RequestLogItem[]>([]);

const gridItems = ref<GridItem[]>([]);

const spMode = computed(() => ['smartphone', 'tablet'].includes(deviceKind));

function onSortOrderUpdate(_sortOrders: SortOrder<GridSortOrderKey>[]) {
	sortOrders.value = _sortOrders;
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

async function onPageChanged(pageNumber: number) {
	currentPage.value = pageNumber;
	await refreshCustomEmojis();
}

async function onImportClicked() {
	const targets = gridItems.value.filter(it => it.checked);
	await importEmojis(targets);
}

function onGridEvent(event: GridEvent) {
	switch (event.type) {
		case 'cell-value-change':
			onGridCellValueChange(event);
			break;
	}
}

function onGridCellValueChange(event: GridCellValueChangeEvent) {
	const { row, column, newValue } = event;
	if (gridItems.value.length > row.index && column.setting.bindTo in gridItems.value[row.index]) {
		gridItems.value[row.index][column.setting.bindTo] = newValue;
	}
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
		title: i18n.ts._customEmojisManager._remote.confirmImportEmojisTitle,
		text: i18n.tsx._customEmojisManager._remote.confirmImportEmojisDescription({ count: targets.length }),
	});

	if (confirm.canceled) {
		return;
	}

	const result = await os.promiseDialog(Promise.all(action()));
	const failedItems = result.filter(it => !it.success);

	if (failedItems.length > 0) {
		await os.alert({
			type: 'error',
			title: i18n.ts._customEmojisManager._gridCommon.alertEmojisRegisterFailedTitle,
			text: i18n.ts._customEmojisManager._gridCommon.alertEmojisRegisterFailedDescription,
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
			sortKeys: sortOrders.value.map(({ key, direction }) => `${direction}${key}`),
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

<style module lang="scss">
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

.gridArea {
	padding-top: 8px;
	padding-bottom: 8px;
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
