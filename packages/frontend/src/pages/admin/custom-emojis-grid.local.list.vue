<template>
<div>
	<div v-if="gridItems.length === 0" style="text-align: center">
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

		<div class="_gaps">
			<div :class="$style.pages">
				<button @click="onLatestButtonClicked">&lt;</button>
				<button @click="onOldestButtonClicked">&gt;</button>
			</div>

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
import { computed, ref, toRefs, watch } from 'vue';
import * as Misskey from 'misskey-js';
import * as os from '@/os.js';
import { fromEmojiDetailed, GridItem } from '@/pages/admin/custom-emojis-grid.impl.js';
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

const emit = defineEmits<{
	(ev: 'operation:search', query: string, sinceId?: string, untilId?: string): void;
}>();

const props = defineProps<{
	customEmojis: Misskey.entities.EmojiDetailed[];
}>();

const { customEmojis } = toRefs(props);

const query = ref('');
const gridItems = ref<GridItem[]>([]);
const originGridItems = ref<GridItem[]>([]);
const updateButtonDisabled = ref<boolean>(false);

const latest = computed(() => customEmojis.value.length > 0 ? customEmojis.value[0]?.id : undefined);
const oldest = computed(() => customEmojis.value.length > 0 ? customEmojis.value[customEmojis.value.length - 1]?.id : undefined);

watch(customEmojis, refreshGridItems, { immediate: true });

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

	async function action() {
		const emptyStrToNull = (value: string) => value === '' ? null : value;
		const emptyStrToEmptyArray = (value: string) => value === '' ? [] : value.split(',').map(it => it.trim());

		for (const item of updatedItems) {
			await misskeyApi('admin/emoji/update', {
				id: item.id!,
				name: item.name,
				category: emptyStrToNull(item.category),
				aliases: emptyStrToEmptyArray(item.aliases),
				license: emptyStrToNull(item.license),
				isSensitive: item.isSensitive,
				localOnly: item.localOnly,
				roleIdsThatCanBeUsedThisEmojiAsReaction: emptyStrToEmptyArray(item.roleIdsThatCanBeUsedThisEmojiAsReaction),
			});
		}
	}

	await os.promiseDialog(
		action(),
		() => {},
		() => {},
	);

	emit('operation:search', query.value, undefined, undefined);
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

	emit('operation:search', query.value, undefined, undefined);
}

function onResetClicked() {
	refreshGridItems();
}

function onSearchButtonClicked() {
	emit('operation:search', query.value, undefined, undefined);
}

async function onLatestButtonClicked() {
	emit('operation:search', query.value, latest.value, undefined);
}

async function onOldestButtonClicked() {
	emit('operation:search', query.value, undefined, oldest.value);
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

function refreshGridItems() {
	gridItems.value = customEmojis.value.map(it => fromEmojiDetailed(it));
	originGridItems.value = JSON.parse(JSON.stringify(gridItems.value));
}

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
	height: 570px;
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
	display: flex;
	align-items: flex-end;
	justify-content: center;
	gap: 8px;
	flex-wrap: wrap;
}

</style>
