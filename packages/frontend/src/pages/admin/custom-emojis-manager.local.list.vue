<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #default>
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
							v-model="queryCategory"
							type="search"
							autocapitalize="off"
							:class="[$style.col2, $style.row1]"
							@enter="onSearchRequest"
						>
							<template #label>category</template>
						</MkInput>
						<MkInput
							v-model="queryAliases"
							type="search"
							autocapitalize="off"
							:class="[$style.col3, $style.row1]"
							@enter="onSearchRequest"
						>
							<template #label>aliases</template>
						</MkInput>

						<MkInput
							v-model="queryType"
							type="search"
							autocapitalize="off"
							:class="[$style.col1, $style.row2]"
							@enter="onSearchRequest"
						>
							<template #label>type</template>
						</MkInput>
						<MkInput
							v-model="queryLicense"
							type="search"
							autocapitalize="off"
							:class="[$style.col2, $style.row2]"
							@enter="onSearchRequest"
						>
							<template #label>license</template>
						</MkInput>
						<MkSelect
							v-model="querySensitive"
							:class="[$style.col3, $style.row2]"
						>
							<template #label>sensitive</template>
							<option :value="null">-</option>
							<option :value="true">true</option>
							<option :value="false">false</option>
						</MkSelect>

						<MkSelect
							v-model="queryLocalOnly"
							:class="[$style.col1, $style.row3]"
						>
							<template #label>localOnly</template>
							<option :value="null">-</option>
							<option :value="true">true</option>
							<option :value="false">false</option>
						</MkSelect>
						<MkInput
							v-model="queryUpdatedAtFrom"
							type="date"
							autocapitalize="off"
							:class="[$style.col2, $style.row3]"
							@enter="onSearchRequest"
						>
							<template #label>updatedAt(from)</template>
						</MkInput>
						<MkInput
							v-model="queryUpdatedAtTo"
							type="date"
							autocapitalize="off"
							:class="[$style.col3, $style.row3]"
							@enter="onSearchRequest"
						>
							<template #label>updatedAt(to)</template>
						</MkInput>

						<MkInput
							v-model="queryRolesText"
							type="text"
							readonly
							autocapitalize="off"
							:class="[$style.col1, $style.row4]"
							@click="onQueryRolesEditClicked"
						>
							<template #label>role</template>
							<template #suffix><span class="ti ti-pencil"/></template>
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

			<component :is="loadingHandler.component.value" v-if="loadingHandler.showing.value"/>
			<template v-else>
				<div v-if="gridItems.length === 0" style="text-align: center">
					{{ i18n.ts._customEmojisManager._local._list.emojisNothing }}
				</div>

				<template v-else>
					<div :class="$style.gridArea">
						<MkGrid :data="gridItems" :settings="setupGrid()" @event="onGridEvent"/>
					</div>

					<div :class="$style.footer">
						<div :class="$style.left">
							<MkButton danger style="margin-right: auto" @click="onDeleteButtonClicked">
								{{ i18n.ts.delete }} ({{ deleteItemsCount }})
							</MkButton>
						</div>

						<div :class="$style.center">
							<MkPagingButtons :current="currentPage" :max="allPages" :buttonCount="5" @pageChanged="onPageChanged"/>
						</div>

						<div :class="$style.right">
							<MkButton primary :disabled="updateButtonDisabled" @click="onUpdateButtonClicked">
								{{ i18n.ts.update }} ({{ updatedItemsCount }})
							</MkButton>
							<MkButton @click="onGridResetButtonClicked">{{ i18n.ts.reset }}</MkButton>
						</div>
					</div>
				</template>
			</template>
		</div>
	</template>
</MkStickyContainer>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, useCssModule } from 'vue';
import * as Misskey from 'misskey-js';
import * as os from '@/os.js';
import {
	emptyStrToEmptyArray,
	emptyStrToNull,
	emptyStrToUndefined,
	GridSortOrderKey,
	gridSortOrderKeys,
	RequestLogItem,
	roleIdsParser,
} from '@/pages/admin/custom-emojis-manager.impl.js';
import MkGrid from '@/components/grid/MkGrid.vue';
import { i18n } from '@/i18n.js';
import MkInput from '@/components/MkInput.vue';
import MkButton from '@/components/MkButton.vue';
import { validators } from '@/components/grid/cell-validators.js';
import { GridCellValidationEvent, GridCellValueChangeEvent, GridEvent } from '@/components/grid/grid-event.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import MkPagingButtons from '@/components/MkPagingButtons.vue';
import XRegisterLogsFolder from '@/pages/admin/custom-emojis-manager.logs-folder.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkSelect from '@/components/MkSelect.vue';
import { deviceKind } from '@/scripts/device-kind.js';
import { GridSetting } from '@/components/grid/grid.js';
import { selectFile } from '@/scripts/select-file.js';
import { copyGridDataToClipboard, removeDataFromGrid } from '@/components/grid/grid-utils.js';
import MkSortOrderEditor from '@/components/MkSortOrderEditor.vue';
import { SortOrder } from '@/components/MkSortOrderEditor.define.js';
import { useLoading } from "@/components/hook/useLoading.js";

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
	roleIdsThatCanBeUsedThisEmojiAsReaction: { id: string, name: string }[];
	fileId?: string;
	updatedAt: string | null;
	publicUrl?: string | null;
	originalUrl?: string | null;
	type: string | null;
}

function setupGrid(): GridSetting {
	const $style = useCssModule();

	const required = validators.required();
	const regex = validators.regex(/^[a-zA-Z0-9_]+$/);
	const unique = validators.unique();
	return {
		row: {
			showNumber: true,
			selectable: true,
			// グリッドの行数をあらかじめ100行確保する
			minimumDefinitionCount: 100,
			styleRules: [
				{
					// 初期値から変わっていたら背景色を変更
					condition: ({ row }) => JSON.stringify(gridItems.value[row.index]) !== JSON.stringify(originGridItems.value[row.index]),
					applyStyle: { className: $style.changedRow },
				},
				{
					// バリデーションに引っかかっていたら背景色を変更
					condition: ({ cells }) => cells.some(it => !it.violation.valid),
					applyStyle: { className: $style.violationRow },
				},
			],
			// 行のコンテキストメニュー設定
			contextMenuFactory: (row, context) => {
				return [
					{
						type: 'button',
						text: i18n.ts._customEmojisManager._gridCommon.copySelectionRows,
						icon: 'ti ti-copy',
						action: () => copyGridDataToClipboard(gridItems, context),
					},
					{
						type: 'button',
						text: i18n.ts._customEmojisManager._local._list.markAsDeleteTargetRows,
						icon: 'ti ti-trash',
						action: () => {
							for (const rangedRow of context.rangedRows) {
								gridItems.value[rangedRow.index].checked = true;
							}
						},
					},
				];
			},
			events: {
				delete(rows) {
					// 行削除時は元データの行を消さず、削除対象としてマークするのみにする
					for (const row of rows) {
						gridItems.value[row.index].checked = true;
					}
				},
			},
		},
		cols: [
			{ bindTo: 'checked', icon: 'ti-trash', type: 'boolean', editable: true, width: 34 },
			{
				bindTo: 'url', icon: 'ti-icons', type: 'image', editable: true, width: 'auto', validators: [required],
				async customValueEditor(row, col, value, cellElement) {
					const file = await selectFile(cellElement);
					gridItems.value[row.index].url = file.url;
					gridItems.value[row.index].fileId = file.id;

					return file.url;
				},
			},
			{
				bindTo: 'name', title: 'name', type: 'text', editable: true, width: 140,
				validators: [required, regex, unique],
			},
			{ bindTo: 'category', title: 'category', type: 'text', editable: true, width: 140 },
			{ bindTo: 'aliases', title: 'aliases', type: 'text', editable: true, width: 140 },
			{ bindTo: 'license', title: 'license', type: 'text', editable: true, width: 140 },
			{ bindTo: 'isSensitive', title: 'sensitive', type: 'boolean', editable: true, width: 90 },
			{ bindTo: 'localOnly', title: 'localOnly', type: 'boolean', editable: true, width: 90 },
			{
				bindTo: 'roleIdsThatCanBeUsedThisEmojiAsReaction', title: 'role', type: 'text', editable: true, width: 140,
				valueTransformer(row) {
					// バックエンドからからはIDと名前のペア配列で受け取るが、表示にIDがあると煩雑なので名前だけにする
					return gridItems.value[row.index].roleIdsThatCanBeUsedThisEmojiAsReaction
						.map((it) => it.name)
						.join(',');
				},
				async customValueEditor(row) {
					// ID直記入は体験的に最悪なのでモーダルを使って入力する
					const current = gridItems.value[row.index].roleIdsThatCanBeUsedThisEmojiAsReaction;
					const result = await os.selectRole({
						initialRoleIds: current.map(it => it.id),
						title: i18n.ts.rolesThatCanBeUsedThisEmojiAsReaction,
						infoMessage: i18n.ts.rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription,
						publicOnly: true,
					});
					if (result.canceled) {
						return current;
					}

					const transform = result.result.map(it => ({ id: it.id, name: it.name }));
					gridItems.value[row.index].roleIdsThatCanBeUsedThisEmojiAsReaction = transform;

					return transform;
				},
				events: {
					paste: roleIdsParser,
					delete(cell) {
						// デフォルトはundefinedになるが、このプロパティは空配列にしたい
						gridItems.value[cell.row.index].roleIdsThatCanBeUsedThisEmojiAsReaction = [];
					},
				},
			},
			{ bindTo: 'type', type: 'text', editable: false, width: 90 },
			{ bindTo: 'updatedAt', type: 'text', editable: false, width: 'auto' },
			{ bindTo: 'publicUrl', type: 'text', editable: false, width: 180 },
			{ bindTo: 'originalUrl', type: 'text', editable: false, width: 180 },
		],
		cells: {
			// セルのコンテキストメニュー設定
			contextMenuFactory(col, row, value, context) {
				return [
					{
						type: 'button',
						text: i18n.ts._customEmojisManager._gridCommon.copySelectionRanges,
						icon: 'ti ti-copy',
						action: () => {
							return copyGridDataToClipboard(gridItems, context);
						},
					},
					{
						type: 'button',
						text: i18n.ts._customEmojisManager._gridCommon.deleteSelectionRanges,
						icon: 'ti ti-trash',
						action: () => {
							removeDataFromGrid(context, (cell) => {
								gridItems.value[cell.row.index][cell.column.setting.bindTo] = undefined;
							});
						},
					},
					{
						type: 'button',
						text: i18n.ts._customEmojisManager._local._list.markAsDeleteTargetRanges,
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

const loadingHandler = useLoading();

const customEmojis = ref<Misskey.entities.EmojiDetailedAdmin[]>([]);
const allPages = ref<number>(0);
const currentPage = ref<number>(0);

const queryName = ref<string | null>(null);
const queryCategory = ref<string | null>(null);
const queryAliases = ref<string | null>(null);
const queryType = ref<string | null>(null);
const queryLicense = ref<string | null>(null);
const queryUpdatedAtFrom = ref<string | null>(null);
const queryUpdatedAtTo = ref<string | null>(null);
const querySensitive = ref<string | null>(null);
const queryLocalOnly = ref<string | null>(null);
const queryRoles = ref<{ id: string, name: string }[]>([]);
const previousQuery = ref<string | undefined>(undefined);
const sortOrders = ref<SortOrder<GridSortOrderKey>[]>([]);
const requestLogs = ref<RequestLogItem[]>([]);

const gridItems = ref<GridItem[]>([]);
const originGridItems = ref<GridItem[]>([]);
const updateButtonDisabled = ref<boolean>(false);

const spMode = computed(() => ['smartphone', 'tablet'].includes(deviceKind));
const queryRolesText = computed(() => queryRoles.value.map(it => it.name).join(','));
const updatedItemsCount = computed(() => {
	return gridItems.value.filter((it, idx) => !it.checked && JSON.stringify(it) !== JSON.stringify(originGridItems.value[idx])).length;
});
const deleteItemsCount = computed(() => gridItems.value.filter(it => it.checked).length);

async function onUpdateButtonClicked() {
	const _items = gridItems.value;
	const _originItems = originGridItems.value;
	if (_items.length !== _originItems.length) {
		throw new Error('The number of items has been changed. Please refresh the page and try again.');
	}

	const updatedItems = _items.filter((it, idx) => !it.checked && JSON.stringify(it) !== JSON.stringify(_originItems[idx]));
	if (updatedItems.length === 0) {
		await os.alert({
			type: 'info',
			text: i18n.ts._customEmojisManager._local._list.alertUpdateEmojisNothingDescription,
		});
		return;
	}

	const confirm = await os.confirm({
		type: 'info',
		title: i18n.ts._customEmojisManager._local._list.confirmUpdateEmojisTitle,
		text: i18n.tsx._customEmojisManager._local._list.confirmUpdateEmojisDescription({ count: updatedItems.length }),
	});
	if (confirm.canceled) {
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
					roleIdsThatCanBeUsedThisEmojiAsReaction: item.roleIdsThatCanBeUsedThisEmojiAsReaction.map(it => it.id),
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

async function onDeleteButtonClicked() {
	const _items = gridItems.value;
	const _originItems = originGridItems.value;
	if (_items.length !== _originItems.length) {
		throw new Error('The number of items has been changed. Please refresh the page and try again.');
	}

	const deleteItems = _items.filter((it) => it.checked);
	if (deleteItems.length === 0) {
		await os.alert({
			type: 'info',
			text: i18n.ts._customEmojisManager._local._list.alertDeleteEmojisNothingDescription,
		});
		return;
	}

	const confirm = await os.confirm({
		type: 'info',
		title: i18n.ts._customEmojisManager._local._list.confirmDeleteEmojisTitle,
		text: i18n.tsx._customEmojisManager._local._list.confirmDeleteEmojisDescription({ count: deleteItems.length }),
	});
	if (confirm.canceled) {
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

async function onQueryRolesEditClicked() {
	const result = await os.selectRole({
		initialRoleIds: queryRoles.value.map(it => it.id),
		title: i18n.ts._customEmojisManager._local._list.dialogSelectRoleTitle,
		publicOnly: true,
	});
	if (result.canceled) {
		return;
	}

	queryRoles.value = result.result;
}

function onSortOrderUpdate(_sortOrders: SortOrder<GridSortOrderKey>[]) {
	sortOrders.value = _sortOrders;
}

async function onSearchRequest() {
	await refreshCustomEmojis();
}

function onQueryResetButtonClicked() {
	queryName.value = null;
	queryCategory.value = null;
	queryAliases.value = null;
	queryType.value = null;
	queryLicense.value = null;
	queryUpdatedAtFrom.value = null;
	queryUpdatedAtTo.value = null;
	querySensitive.value = null;
	queryLocalOnly.value = null;
	queryRoles.value = [];
}

async function onPageChanged(pageNumber: number) {
	currentPage.value = pageNumber;
	await refreshCustomEmojis();
}

function onGridEvent(event: GridEvent) {
	switch (event.type) {
		case 'cell-validation':
			onGridCellValidation(event);
			break;
		case 'cell-value-change':
			onGridCellValueChange(event);
			break;
	}
}

function onGridCellValidation(event: GridCellValidationEvent) {
	updateButtonDisabled.value = event.all.filter(it => !it.valid).length > 0;
}

function onGridCellValueChange(event: GridCellValueChangeEvent) {
	const { row, column, newValue } = event;
	if (gridItems.value.length > row.index && column.setting.bindTo in gridItems.value[row.index]) {
		gridItems.value[row.index][column.setting.bindTo] = newValue;
	}
}

async function refreshCustomEmojis() {
	const limit = 100;

	const query: Misskey.entities.V2AdminEmojiListRequest['query'] = {
		name: emptyStrToUndefined(queryName.value),
		type: emptyStrToUndefined(queryType.value),
		aliases: emptyStrToUndefined(queryAliases.value),
		category: emptyStrToUndefined(queryCategory.value),
		license: emptyStrToUndefined(queryLicense.value),
		isSensitive: querySensitive.value ? Boolean(querySensitive.value).valueOf() : undefined,
		localOnly: queryLocalOnly.value ? Boolean(queryLocalOnly.value).valueOf() : undefined,
		updatedAtFrom: emptyStrToUndefined(queryUpdatedAtFrom.value),
		updatedAtTo: emptyStrToUndefined(queryUpdatedAtTo.value),
		roleIds: queryRoles.value.map(it => it.id),
		hostType: 'local',
	};

	if (JSON.stringify(query) !== previousQuery.value) {
		currentPage.value = 1;
	}

	const result = await loadingHandler.scope(() => misskeyApi('v2/admin/emoji/list', {
		query: query,
		limit: limit,
		page: currentPage.value,
		sortKeys: sortOrders.value.map(({ key, direction }) => `${direction}${key}` as any),
	}));

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
		roleIdsThatCanBeUsedThisEmojiAsReaction: it.roleIdsThatCanBeUsedThisEmojiAsReaction,
		updatedAt: it.updatedAt,
		publicUrl: it.publicUrl,
		originalUrl: it.originalUrl,
		type: it.type,
	}));
	originGridItems.value = JSON.parse(JSON.stringify(gridItems.value));
}

onMounted(async () => {
	await refreshCustomEmojis();
});

</script>

<style module lang="scss">
.violationRow {
	background-color: var(--MI_THEME-infoWarnBg);
}

.changedRow {
	background-color: var(--MI_THEME-infoBg);
}

.editedRow {
	background-color: var(--MI_THEME-infoBg);
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

.gridArea {
	padding-top: 8px;
	padding-bottom: 8px;
}

.footer {
	background-color: var(--MI_THEME-bg);

	position: sticky;
	left:0;
	bottom:0;
	z-index: 1;
	// stickyで追従させる都合上、フッター自身でpaddingを持つ必要があるため、親要素で画一的に指定している分をネガティブマージンで相殺している
	margin-top: calc(var(--MI-margin) * -1);
	margin-bottom: calc(var(--MI-margin) * -1);
	padding-top: var(--MI-margin);
	padding-bottom: var(--MI-margin);

	display: grid;
	grid-template-columns: 1fr 1fr 1fr;
	gap: 8px;

	& .left {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		gap: 8px;
	}

	& .center {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
	}

	& .right {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		flex-direction: row;
		gap: 8px;
	}
}

.divider {
	margin: 8px 0;
	border-top: solid 0.5px var(--MI_THEME-divider);
}

</style>
