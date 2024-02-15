<template>
<div>
	<div v-if="false" style="text-align: center">
		登録された絵文字はありません。
	</div>
	<div v-else class="_gaps">
		<MkFolder>
			<template #icon><i class="ti ti-search"></i></template>
			<template #label>検索設定</template>
			<template #caption>
				検索条件を詳細に設定します。
			</template>

			<div class="_gaps">
				<div :class="[[spMode ? $style.searchAreaSp : $style.searchArea]]">
					<MkInput v-model="queryName" :debounce="true" type="search" autocapitalize="off" class="col1 row1">
						<template #label>name</template>
					</MkInput>
					<MkInput
						v-model="queryCategory" :debounce="true" type="search" autocapitalize="off" class="col2 row1"
					>
						<template #label>category</template>
					</MkInput>
					<MkInput
						v-model="queryAlias" :debounce="true" type="search" autocapitalize="off" class="col3 row1"
					>
						<template #label>alias</template>
					</MkInput>

					<MkInput
						v-model="queryType" :debounce="true" type="search" autocapitalize="off" class="col1 row2"
					>
						<template #label>type</template>
					</MkInput>
					<MkInput
						v-model="queryLicense" :debounce="true" type="search" autocapitalize="off" class="col2 row2"
					>
						<template #label>license</template>
					</MkInput>
					<MkSelect v-model="querySensitive" class="col3 row2">
						<template #label>sensitive</template>
						<option :value="null">-</option>
						<option :value="true">true</option>
						<option :value="false">false</option>
					</MkSelect>

					<MkSelect v-model="queryLocalOnly" class="col1 row3">
						<template #label>localOnly</template>
						<option :value="null">-</option>
						<option :value="true">true</option>
						<option :value="false">false</option>
					</MkSelect>
					<MkInput v-model="queryUpdatedAtFrom" :debounce="true" type="date" autocapitalize="off" class="col2 row3">
						<template #label>updatedAt(from)</template>
					</MkInput>
					<MkInput v-model="queryUpdatedAtTo" :debounce="true" type="date" autocapitalize="off" class="col3 row3">
						<template #label>updatedAt(to)</template>
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
					<MkButton primary @click="onSearchButtonClicked">
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

		<div :class="$style.gridArea">
			<MkGrid :data="gridItems" :settings="setupGrid()" @event="onGridEvent"/>
		</div>

		<MkPagingButtons :current="currentPage" :max="allPages" :buttonCount="5" @pageChanged="onPageChanged"/>

		<div class="_gaps">
			<div :class="$style.buttons">
				<MkButton danger style="margin-right: auto" @click="onDeleteButtonClicked">{{ i18n.ts.delete }}</MkButton>
				<MkButton primary :disabled="updateButtonDisabled" @click="onUpdateButtonClicked">
					{{
						i18n.ts.update
					}}
				</MkButton>
				<MkButton @click="onGridResetButtonClicked">リセット</MkButton>
			</div>
		</div>
	</div>
</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import * as Misskey from 'misskey-js';
import * as os from '@/os.js';
import {
	emptyStrToEmptyArray,
	emptyStrToNull,
	emptyStrToUndefined,
	RequestLogItem,
} from '@/pages/admin/custom-emojis-grid.impl.js';
import MkGrid from '@/components/grid/MkGrid.vue';
import { i18n } from '@/i18n.js';
import MkInput from '@/components/MkInput.vue';
import MkButton from '@/components/MkButton.vue';
import { validators } from '@/components/grid/cell-validators.js';
import {
	GridCellValidationEvent,
	GridCellValueChangeEvent,
	GridContext,
	GridEvent,
	GridKeyDownEvent,
} from '@/components/grid/grid-event.js';
import { optInGridUtils } from '@/components/grid/optin-utils.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import MkPagingButtons from '@/components/MkPagingButtons.vue';
import XRegisterLogs from '@/pages/admin/custom-emojis-grid.local.logs.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkSelect from '@/components/MkSelect.vue';
import { deviceKind } from '@/scripts/device-kind.js';
import { GridSetting } from '@/components/grid/grid.js';
import MkTagItem from '@/components/MkTagItem.vue';
import { MenuItem } from '@/types/menu.js';

type GridItem = {
	checked: boolean;
	id: string;
	url: string;
	name: string;
	host: string;
	category: string;
	aliases: string;
	license: string;
	isSensitive: boolean;
	localOnly: boolean;
	roleIdsThatCanBeUsedThisEmojiAsReaction: string;
	fileId?: string;
	updatedAt: string | null;
	publicUrl?: string | null;
	originalUrl?: string | null;
}

const gridSortOrderKeys = [
	'name',
	'category',
	'aliases',
	'type',
	'license',
	'isSensitive',
	'localOnly',
	'updatedAt',
];
type GridSortOrderKey = typeof gridSortOrderKeys[number];

type GridSortOrder = {
	key: GridSortOrderKey;
	direction: 'ASC' | 'DESC';
}

function setupGrid(): GridSetting {
	const required = validators.required();
	const regex = validators.regex(/^[a-zA-Z0-9_]+$/);
	return {
		row: {
			showNumber: true,
			selectable: true,
			minimumDefinitionCount: 100,
			styleRules: [
				{
					condition: ({ row }) => JSON.stringify(gridItems.value[row.index]) !== JSON.stringify(originGridItems.value[row.index]),
					applyStyle: { className: 'changedRow' },
				},
				{
					condition: ({ cells }) => cells.some(it => !it.violation.valid),
					applyStyle: { className: 'violationRow' },
				},
			],
			contextMenuFactory: (row, context) => {
				return [
					{
						type: 'button',
						text: '選択行をコピー',
						icon: 'ti ti-copy',
						action: () => optInGridUtils.copyToClipboard(gridItems, context),
					},
					{
						type: 'button',
						text: '選択行を削除対象とする',
						icon: 'ti ti-trash',
						action: () => {
							for (const row of context.rangedRows) {
								gridItems.value[row.index].checked = true;
							}
						},
					},
				];
			},
		},
		cols: [
			{ bindTo: 'checked', icon: 'ti-trash', type: 'boolean', editable: true, width: 34 },
			{ bindTo: 'url', icon: 'ti-icons', type: 'image', editable: true, width: 'auto', validators: [required] },
			{ bindTo: 'name', title: 'name', type: 'text', editable: true, width: 140, validators: [required, regex] },
			{ bindTo: 'category', title: 'category', type: 'text', editable: true, width: 140 },
			{ bindTo: 'aliases', title: 'aliases', type: 'text', editable: true, width: 140 },
			{ bindTo: 'license', title: 'license', type: 'text', editable: true, width: 140 },
			{ bindTo: 'isSensitive', title: 'sensitive', type: 'boolean', editable: true, width: 90 },
			{ bindTo: 'localOnly', title: 'localOnly', type: 'boolean', editable: true, width: 90 },
			{ bindTo: 'roleIdsThatCanBeUsedThisEmojiAsReaction', title: 'role', type: 'text', editable: true, width: 140 },
			{ bindTo: 'updatedAt', type: 'text', editable: false, width: 'auto' },
			{ bindTo: 'publicUrl', type: 'text', editable: false, width: 180 },
			{ bindTo: 'originalUrl', type: 'text', editable: false, width: 180 },
		],
		cells: {
			contextMenuFactory: (col, row, value, context) => {
				return [
					{
						type: 'button',
						text: '選択範囲をコピー',
						icon: 'ti ti-copy',
						action: () => optInGridUtils.copyToClipboard(gridItems, context),
					},
					{
						type: 'button',
						text: '選択範囲を削除',
						icon: 'ti ti-trash',
						action: () => optInGridUtils.deleteSelectionRange(gridItems, context),
					},
					{
						type: 'button',
						text: '選択行を削除対象とする',
						icon: 'ti ti-trash',
						action: () => {
							for (const rowIdx of [...new Set(context.rangedCells.map(it => it.row.index)).values()]) {
								gridItems.value[rowIdx].checked = true;
							}
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
const queryCategory = ref<string | null>(null);
const queryAlias = ref<string | null>(null);
const queryType = ref<string | null>(null);
const queryLicense = ref<string | null>(null);
const queryUpdatedAtFrom = ref<string | null>(null);
const queryUpdatedAtTo = ref<string | null>(null);
const querySensitive = ref<string | null>(null);
const queryLocalOnly = ref<string | null>(null);
const previousQuery = ref<string | undefined>(undefined);
const sortOrders = ref<GridSortOrder[]>([]);
const requestLogs = ref<RequestLogItem[]>([]);

const gridItems = ref<GridItem[]>([]);
const originGridItems = ref<GridItem[]>([]);
const updateButtonDisabled = ref<boolean>(false);

const spMode = computed(() => ['smartphone', 'tablet'].includes(deviceKind));

async function onUpdateButtonClicked() {
	const _items = gridItems.value;
	const _originItems = originGridItems.value;
	if (_items.length !== _originItems.length) {
		throw new Error('The number of items has been changed. Please refresh the page and try again.');
	}

	const confirm = await os.confirm({
		type: 'info',
		title: '確認',
		text: '絵文字の変更を保存します。よろしいですか？',
	});
	if (confirm.canceled) {
		return;
	}

	const updatedItems = _items.filter((it, idx) => !it.checked && JSON.stringify(it) !== JSON.stringify(_originItems[idx]));
	if (updatedItems.length === 0) {
		await os.alert({
			type: 'info',
			text: '変更された絵文字はありません。',
		});
		return;
	}

	const action = () => {
		return updatedItems.map(item =>
			misskeyApi(
				'admin/emoji/update',
				{
					// eslint-disable-next-line
					id: item.id!,
					name: item.name,
					category: emptyStrToNull(item.category),
					aliases: emptyStrToEmptyArray(item.aliases),
					license: emptyStrToNull(item.license),
					isSensitive: item.isSensitive,
					localOnly: item.localOnly,
					roleIdsThatCanBeUsedThisEmojiAsReaction: emptyStrToEmptyArray(item.roleIdsThatCanBeUsedThisEmojiAsReaction),
					fileId: item.fileId,
				})
				.then(() => ({ item, success: true, err: undefined }))
				.catch(err => ({ item, success: false, err })),
		);
	};

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

async function onDeleteButtonClicked() {
	const _items = gridItems.value;
	const _originItems = originGridItems.value;
	if (_items.length !== _originItems.length) {
		throw new Error('The number of items has been changed. Please refresh the page and try again.');
	}

	const confirm = await os.confirm({
		type: 'info',
		title: '確認',
		text: 'チェックをつけられた絵文字を削除します。よろしいですか？',
	});
	if (confirm.canceled) {
		return;
	}

	const deleteItems = _items.filter((it) => it.checked);
	if (deleteItems.length === 0) {
		await os.alert({
			type: 'info',
			text: '削除対象の絵文字はありません。',
		});
		return;
	}

	async function action() {
		const deleteIds = deleteItems.map(it => it.id!);
		await misskeyApi('admin/emoji/delete-bulk', { ids: deleteIds });
	}

	await os.promiseDialog(
		action(),
	);
}

function onGridResetButtonClicked() {
	refreshGridItems();
}

function onToggleSortOrderButtonClicked(order: GridSortOrder) {
	console.log(order);
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

async function onSearchButtonClicked() {
	await refreshCustomEmojis();
}

function onQueryResetButtonClicked() {
	queryName.value = null;
	queryCategory.value = null;
	queryAlias.value = null;
	queryType.value = null;
	queryLicense.value = null;
	queryUpdatedAtFrom.value = null;
	queryUpdatedAtTo.value = null;
	querySensitive.value = null;
	queryLocalOnly.value = null;
}

async function onPageChanged(pageNumber: number) {
	currentPage.value = pageNumber;
	await refreshCustomEmojis();
}

function onGridEvent(event: GridEvent, currentState: GridContext) {
	switch (event.type) {
		case 'cell-validation':
			onGridCellValidation(event);
			break;
		case 'cell-value-change':
			onGridCellValueChange(event);
			break;
		case 'keydown':
			onGridKeyDown(event, currentState);
			break;
	}
}

function onGridCellValidation(event: GridCellValidationEvent) {
	updateButtonDisabled.value = event.all.filter(it => !it.valid).length > 0;
}

function onGridCellValueChange(event: GridCellValueChangeEvent) {
	const { row, column, newValue } = event;
	if (gridItems.value.length > row.index && column.setting.bindTo in gridItems.value[row.index]) {
		if (column.setting.bindTo === 'url') {
			const file = JSON.parse(newValue as string) as Misskey.entities.DriveFile;
			gridItems.value[row.index].url = file.url;
			gridItems.value[row.index].fileId = file.id;
		} else {
			gridItems.value[row.index][column.setting.bindTo] = newValue;
		}
	}
}

async function onGridKeyDown(event: GridKeyDownEvent, currentState: GridContext) {
	const { ctrlKey, shiftKey, code } = event.event;

	switch (true) {
		case ctrlKey && shiftKey: {
			break;
		}
		case ctrlKey: {
			switch (code) {
				case 'KeyC': {
					optInGridUtils.copyToClipboard(gridItems, currentState);
					break;
				}
				case 'KeyV': {
					await optInGridUtils.pasteFromClipboard(gridItems, currentState);
					break;
				}
			}
			break;
		}
		case shiftKey: {
			break;
		}
		default: {
			switch (code) {
				case 'Delete': {
					if (currentState.rangedRows.length > 0) {
						for (const row of currentState.rangedRows) {
							gridItems.value[row.index].checked = true;
						}
					} else {
						const ranges = currentState.rangedCells;
						for (const cell of ranges) {
							if (cell.column.setting.editable) {
								gridItems.value[cell.row.index][cell.column.setting.bindTo] = undefined;
							}
						}
					}
					break;
				}
			}
			break;
		}
	}
}

async function refreshCustomEmojis() {
	const limit = 100;

	const query: Misskey.entities.AdminEmojiV2ListRequest['query'] = {
		name: emptyStrToUndefined(queryName.value),
		type: emptyStrToUndefined(queryType.value),
		aliases: emptyStrToUndefined(queryAlias.value),
		category: emptyStrToUndefined(queryCategory.value),
		license: emptyStrToUndefined(queryLicense.value),
		isSensitive: querySensitive.value ? Boolean(querySensitive.value).valueOf() : undefined,
		localOnly: queryLocalOnly.value ? Boolean(queryLocalOnly.value).valueOf() : undefined,
		updatedAtFrom: emptyStrToUndefined(queryUpdatedAtFrom.value),
		updatedAtTo: emptyStrToUndefined(queryUpdatedAtTo.value),
		hostType: 'local',
	};

	if (JSON.stringify(query) !== previousQuery.value) {
		currentPage.value = 1;
	}

	const result = await os.promiseDialog(
		misskeyApi('admin/emoji/v2/list', {
			query: query,
			limit: limit,
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

	refreshGridItems();
}

function refreshGridItems() {
	gridItems.value = customEmojis.value.map(it => ({
		checked: false,
		id: it.id,
		fileId: undefined,
		url: it.publicUrl,
		name: it.name,
		host: it.host ?? '',
		category: it.category ?? '',
		aliases: it.aliases.join(','),
		license: it.license ?? '',
		isSensitive: it.isSensitive,
		localOnly: it.localOnly,
		roleIdsThatCanBeUsedThisEmojiAsReaction: it.roleIdsThatCanBeUsedThisEmojiAsReaction.join(','),
		updatedAt: it.updatedAt,
		publicUrl: it.publicUrl,
		originalUrl: it.originalUrl,
	}));
	originGridItems.value = JSON.parse(JSON.stringify(gridItems.value));
}

onMounted(async () => {
	await refreshCustomEmojis();
});

</script>

<style lang="scss">
.violationRow {
	background-color: var(--infoWarnBg);
}

.changedRow {
	background-color: var(--infoBg);
}
</style>

<style lang="scss">
.editedRow {
	background-color: var(--infoBg);
}

.row1 {
	grid-row: 1 / 2;
}

.row2 {
	grid-row: 2 / 3;
}

.row3 {
	grid-row: 3 / 4;
}

.row4 {
	grid-row: 4 / 5;
}

.col1 {
	grid-column: 1 / 2;
}

.col2 {
	grid-column: 2 / 3;
}

.col3 {
	grid-column: 3 / 4;
}
</style>

<style module lang="scss">
.searchArea {
	display: grid;
	grid-template-columns: 1fr 1fr 1fr;
	gap: 16px;
}

.searchAreaSp {
	display: flex;
	flex-direction: column;
	gap: 8px;
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

.buttons {
	display: flex;
	align-items: flex-end;
	justify-content: center;
	gap: 8px;
	flex-wrap: wrap;
}

.divider {
	margin: 8px 0;
	border-top: solid 0.5px var(--divider);
}
</style>
