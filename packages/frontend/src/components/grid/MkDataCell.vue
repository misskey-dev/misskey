<template>
<td
	ref="rootEl"
	:class="$style.cell"
	:style="{ maxWidth: cellWidth, minWidth: cellWidth }"
	:tabindex="-1"
	@dblclick="onCellDoubleClick"
	@keydown="onCellKeyDown"
>
	<div
		:class="[
			$style.root,
			[cell.selected ? $style.selected : {}],
			[cell.ranged ? $style.ranged : {}],
			[needsContentCentering ? $style.center : {}]
		]"
	>
		<div v-if="!editing" ref="contentAreaEl">
			<div :class="$style.content">
				<div v-if="cellType === 'text'">
					{{ cell.value }}
				</div>
				<div v-else-if="cellType === 'boolean'">
					<span v-if="cell.value === true" class="ti ti-check"/>
					<span v-else class="ti ti-x"/>
				</div>
				<div v-else-if="cellType === 'image'">
					<img
						:src="cell.value as string"
						:alt="cell.value as string"
						:class="$style.viewImage"
					/>
				</div>
			</div>
		</div>
		<div v-else ref="inputAreaEl">
			<input
				v-if="cellType === 'text'"
				type="text"
				:class="$style.editingInput"
				:value="editingValue"
				@input="onInputText"
			/>
		</div>
	</div>
</td>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, toRefs, watch } from 'vue';
import {
	CellValue,
	equalCellAddress,
	getCellAddress,
	GridCell,
	GridEventEmitter,
	Size,
} from '@/components/grid/types.js';

const emit = defineEmits<{
	(ev: 'operation:beginEdit', sender: GridCell): void;
	(ev: 'operation:endEdit', sender: GridCell): void;
	(ev: 'change:value', sender: GridCell, newValue: CellValue): void;
	(ev: 'change:contentSize', sender: GridCell, newSize: Size): void;
}>();
const props = defineProps<{
	cell: GridCell,
	bus: GridEventEmitter,
}>();

const { cell, bus } = toRefs(props);

const rootEl = ref<InstanceType<typeof HTMLTableCellElement>>();
const contentAreaEl = ref<InstanceType<typeof HTMLDivElement>>();
const inputAreaEl = ref<InstanceType<typeof HTMLDivElement>>();

const editing = ref<boolean>(false);
const editingValue = ref<CellValue>(undefined);

const cellWidth = computed(() => cell.value.column.width);
const cellType = computed(() => cell.value.column.setting.type);
const needsContentCentering = computed(() => {
	switch (cellType.value) {
		case 'boolean':
			return true;
		default:
			return false;
	}
});

watch(() => [cell, cell.value.value], () => {
	// 中身がセットされた直後はサイズが分からないので、次のタイミングで更新する
	nextTick(emitContentSizeChanged);
});
watch(() => cell.value.selected, () => {
	if (cell.value.selected) {
		rootEl.value?.focus();
	}
});

function onCellDoubleClick(ev: MouseEvent) {
	switch (ev.type) {
		case 'dblclick': {
			beginEditing();
			break;
		}
	}
}

function onOutsideMouseDown(ev: MouseEvent) {
	const isOutside = ev.target instanceof Node && !rootEl.value?.contains(ev.target);
	if (isOutside || !equalCellAddress(cell.value.address, getCellAddress(ev.target as HTMLElement))) {
		endEditing(true);
	}
}

function onCellKeyDown(ev: KeyboardEvent) {
	if (!editing.value) {
		ev.preventDefault();
		switch (ev.code) {
			case 'Enter':
			case 'F2': {
				beginEditing();
				break;
			}
		}
	} else {
		switch (ev.code) {
			case 'Escape': {
				endEditing(false);
				break;
			}
			case 'Enter': {
				if (!ev.isComposing) {
					endEditing(true);
				}
			}
		}
	}
}

function onInputText(ev: Event) {
	editingValue.value = (ev.target as HTMLInputElement).value;
}

function registerOutsideMouseDown() {
	unregisterOutsideMouseDown();
	addEventListener('mousedown', onOutsideMouseDown);
}

function unregisterOutsideMouseDown() {
	removeEventListener('mousedown', onOutsideMouseDown);
}

function beginEditing() {
	if (editing.value || !cell.value.column.setting.editable) {
		return;
	}

	switch (cellType.value) {
		case 'text': {
			editingValue.value = cell.value.value;
			editing.value = true;
			registerOutsideMouseDown();
			emit('operation:beginEdit', cell.value);

			nextTick(() => {
				// inputの展開後にフォーカスを当てたい
				if (inputAreaEl.value) {
					(inputAreaEl.value.querySelector('*') as HTMLElement).focus();
				}
			});
			break;
		}
		case 'boolean': {
			// とくに特殊なUIは設けず、トグルするだけ
			emitValueChange(!cell.value.value);
			break;
		}
	}
}

function endEditing(applyValue: boolean) {
	if (!editing.value) {
		return;
	}

	emit('operation:endEdit', cell.value);
	unregisterOutsideMouseDown();

	if (applyValue) {
		emitValueChange(editingValue.value);
	}

	editingValue.value = undefined;
	editing.value = false;

	rootEl.value?.focus();
}

function emitValueChange(newValue: CellValue) {
	emit('change:value', cell.value, newValue);
}

function emitContentSizeChanged() {
	emit('change:contentSize', cell.value, {
		width: contentAreaEl.value?.clientWidth ?? 0,
		height: contentAreaEl.value?.clientHeight ?? 0,
	});
}

</script>

<style module lang="scss">
$cellHeight: 28px;

.cell {
	overflow: hidden;
	white-space: nowrap;
	height: $cellHeight;
	max-height: $cellHeight;
	min-height: $cellHeight;
	border-left: solid 0.5px var(--divider);
	border-top: solid 0.5px var(--divider);
	cursor: cell;

	&:focus {
		outline: none;
	}
}

.root {
	display: flex;
	flex-direction: row;
	align-items: center;
	box-sizing: border-box;
	height: 100%;

	// selected適用時に中身がズレてしまうので、透明の線をあらかじめ引いておきたい
	border: solid 0.5px transparent;

	&.selected {
		border: solid 0.5px var(--accentLighten);
	}

	&.ranged {
		background-color: var(--accentedBg);
	}

	&.center {
		justify-content: center;
	}
}

.content {
	display: inline-block;
	padding: 0 8px;
}

.viewImage {
	width: auto;
	max-height: $cellHeight;
	height: $cellHeight;
	object-fit: cover;
}

.editingInput {
	padding: 0 8px;
	width: 100%;
	max-width: 100%;
	box-sizing: border-box;
	min-height: $cellHeight;
	max-height: $cellHeight;
	height: $cellHeight + 4px;
	outline: none;
	border: none;
	font-family: 'Hiragino Maru Gothic Pro', "BIZ UDGothic", Roboto, HelveticaNeue, Arial, sans-serif;
}

</style>
