<template>
<div>
	<div v-if="false" style="text-align: center">
		登録された絵文字はありません。
	</div>
	<div v-else class="_gaps">
		<div :class="$style.searchArea">
			<MkInput v-model="query" :debounce="true" type="search" autocapitalize="off" style="flex: 1">
				<template #prefix><i class="ti ti-search"></i></template>
			</MkInput>
			<MkButton primary style="margin-left: auto;" @click="onSearchButtonClicked">
				{{ i18n.ts.search }}
			</MkButton>
		</div>

		<div :class="$style.gridArea">
			<MkGrid :data="gridItems" :gridSetting="gridSetting" :columnSettings="columnSettings" @event="onGridEvent"/>
		</div>

		<MkPagingButtons :current="currentPage" :max="allPages" :buttonCount="5" @pageChanged="onPageChanged"/>

		<div class="_gaps">
			<div :class="$style.buttons">
				<MkButton danger style="margin-right: auto" @click="onDeleteClicked">{{ i18n.ts.delete }}</MkButton>
				<MkButton primary :disabled="updateButtonDisabled" @click="onUpdateClicked">{{ i18n.ts.update }}</MkButton>
				<MkButton @click="onResetClicked">リセット</MkButton>
			</div>
		</div>
	</div>
</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, toRefs, watch } from 'vue';
import * as Misskey from 'misskey-js';
import * as os from '@/os.js';
import { fromEmojiDetailedAdmin, GridItem } from '@/pages/admin/custom-emojis-grid.impl.js';
import MkGrid from '@/components/grid/MkGrid.vue';
import { i18n } from '@/i18n.js';
import MkInput from '@/components/MkInput.vue';
import MkButton from '@/components/MkButton.vue';
import { ColumnSetting } from '@/components/grid/column.js';
import { validators } from '@/components/grid/cell-validators.js';
import {
	GridCellContextMenuEvent,
	GridCellValidationEvent,
	GridCellValueChangeEvent,
	GridCurrentState,
	GridEvent,
	GridKeyDownEvent,
	GridRowContextMenuEvent,
} from '@/components/grid/grid-event.js';
import { optInGridUtils } from '@/components/grid/optin-utils.js';
import { GridSetting } from '@/components/grid/grid.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import MkPagingButtons from '@/components/MkPagingButtons.vue';

const gridSetting: GridSetting = {
	rowNumberVisible: true,
	rowSelectable: false,
};

const required = validators.required();
const regex = validators.regex(/^[a-zA-Z0-9_]+$/);
const columnSettings: ColumnSetting[] = [
	{ bindTo: 'checked', icon: 'ti-trash', type: 'boolean', editable: true, width: 34 },
	{ bindTo: 'url', icon: 'ti-icons', type: 'image', editable: false, width: 'auto', validators: [required] },
	{ bindTo: 'name', title: 'name', type: 'text', editable: true, width: 140, validators: [required, regex] },
	{ bindTo: 'category', title: 'category', type: 'text', editable: true, width: 140 },
	{ bindTo: 'aliases', title: 'aliases', type: 'text', editable: true, width: 140 },
	{ bindTo: 'license', title: 'license', type: 'text', editable: true, width: 140 },
	{ bindTo: 'isSensitive', title: 'sensitive', type: 'boolean', editable: true, width: 90 },
	{ bindTo: 'localOnly', title: 'localOnly', type: 'boolean', editable: true, width: 90 },
	{ bindTo: 'roleIdsThatCanBeUsedThisEmojiAsReaction', title: 'role', type: 'text', editable: true, width: 140 },
];

const customEmojis = ref<Misskey.entities.EmojiDetailedAdmin[]>([]);
const query = ref('');
const allPages = ref<number>(0);
const currentPage = ref<number>(0);
const previousQuery = ref<string | undefined>(undefined);

const gridItems = ref<GridItem[]>([]);
const originGridItems = ref<GridItem[]>([]);
const updateButtonDisabled = ref<boolean>(false);

async function onUpdateClicked() {
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
		const emptyStrToNull = (value: string) => value === '' ? null : value;
		const emptyStrToEmptyArray = (value: string) => value === '' ? [] : value.split(',').map(it => it.trim());

		return updatedItems.map(item =>
			misskeyApi('admin/emoji/update', {
				id: item.id!,
				name: item.name,
				category: emptyStrToNull(item.category),
				aliases: emptyStrToEmptyArray(item.aliases),
				license: emptyStrToNull(item.license),
				isSensitive: item.isSensitive,
				localOnly: item.localOnly,
				roleIdsThatCanBeUsedThisEmojiAsReaction: emptyStrToEmptyArray(item.roleIdsThatCanBeUsedThisEmojiAsReaction),
			}),
		);
	};

	await os.promiseDialog(Promise.all(action()));
}

async function onDeleteClicked() {
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
		() => {},
		() => {},
	);
}

function onResetClicked() {
	refreshGridItems();
}

function onSearchButtonClicked() {
}

async function onPageChanged(pageNumber: number) {
	currentPage.value = pageNumber;
	await refreshCustomEmojis();
}

function onGridEvent(event: GridEvent, currentState: GridCurrentState) {
	switch (event.type) {
		case 'cell-validation':
			onGridCellValidation(event);
			break;
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

function onGridCellValidation(event: GridCellValidationEvent) {
	updateButtonDisabled.value = event.all.filter(it => !it.valid).length > 0;
}

function onGridRowContextMenu(event: GridRowContextMenuEvent, currentState: GridCurrentState) {
	event.menuItems.push(
		{
			type: 'button',
			text: '選択行をコピー',
			icon: 'ti ti-copy',
			action: () => optInGridUtils.copyToClipboard(gridItems, currentState),
		},
		{
			type: 'button',
			text: '選択行を削除対象とする',
			icon: 'ti ti-trash',
			action: () => {
				for (const row of currentState.rangedRows) {
					gridItems.value[row.index].checked = true;
				}
			},
		},
	);
}

function onGridCellContextMenu(event: GridCellContextMenuEvent, currentState: GridCurrentState) {
	event.menuItems.push(
		{
			type: 'button',
			text: '選択範囲をコピー',
			icon: 'ti ti-copy',
			action: () => optInGridUtils.copyToClipboard(gridItems, currentState),
		},
		{
			type: 'button',
			text: '選択範囲を削除',
			icon: 'ti ti-trash',
			action: () => optInGridUtils.deleteSelectionRange(gridItems, currentState),
		},
		{
			type: 'button',
			text: '選択行を削除対象とする',
			icon: 'ti ti-trash',
			action: () => {
				for (const rowIdx of [...new Set(currentState.rangedCells.map(it => it.row.index)).values()]) {
					gridItems.value[rowIdx].checked = true;
				}
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

async function refreshCustomEmojis() {
	const limit = 10;

	const query: Misskey.entities.AdminEmojiV2ListRequest['query'] = {
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
		}),
		() => {},
		() => {},
	);

	customEmojis.value = result.emojis;
	allPages.value = result.allPages;

	previousQuery.value = JSON.stringify(query);

	refreshGridItems();
}

function refreshGridItems() {
	gridItems.value = customEmojis.value.map(it => fromEmojiDetailedAdmin(it));
	originGridItems.value = JSON.parse(JSON.stringify(gridItems.value));
}

onMounted(async () => {
	await refreshCustomEmojis();
});

</script>

<style module lang="scss">
.searchArea {
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: stretch;
	gap: 8px;
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

</style>
