<template>
<th
	ref="rootEl"
	:class="$style.cell"
	:style="[{ width: column.width }]"
>
	<div :class="$style.root">
		<div :class="$style.left"/>
		<div :class="$style.wrapper">
			<div ref="contentEl" :class="$style.contentArea">
				{{ text }}
			</div>
		</div>
		<div
			:class="$style.right"
			@mousedown="onHandleMouseDown"
			@dblclick="onHandleDoubleClick"
		/>
	</div>
</th>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, toRefs, watch } from 'vue';
import { GridColumn, GridEventEmitter, Size } from '@/components/grid/grid.js';

const emit = defineEmits<{
	(ev: 'operation:beginWidthChange', sender: GridColumn): void;
	(ev: 'operation:endWidthChange', sender: GridColumn): void;
	(ev: 'operation:widthLargest', sender: GridColumn): void;
	(ev: 'change:width', sender: GridColumn, width: string): void;
	(ev: 'change:contentSize', sender: GridColumn, newSize: Size): void;
}>();
const props = defineProps<{
	column: GridColumn,
	bus: GridEventEmitter,
}>();

const { column, bus } = toRefs(props);

const rootEl = ref<InstanceType<typeof HTMLTableCellElement>>();
const contentEl = ref<InstanceType<typeof HTMLDivElement>>();

const resizing = ref<boolean>(false);

const text = computed(() => {
	const result = column.value.setting.title ?? column.value.setting.bindTo;
	return result.length > 0 ? result : '　';
});

watch(column, () => {
	// 中身がセットされた直後はサイズが分からないので、次のタイミングで更新する
	nextTick(updateContentSize);
});

function onHandleDoubleClick(ev: MouseEvent) {
	switch (ev.type) {
		case 'dblclick': {
			emit('operation:widthLargest', column.value);
			break;
		}
	}
}

function onHandleMouseDown(ev: MouseEvent) {
	switch (ev.type) {
		case 'mousedown': {
			if (!resizing.value) {
				registerHandleMouseUp();
				registerHandleMouseMove();
				resizing.value = true;
				emit('operation:beginWidthChange', column.value);
			}
			break;
		}
	}
}

function onHandleMouseMove(ev: MouseEvent) {
	if (!rootEl.value) {
		// 型ガード
		return;
	}

	switch (ev.type) {
		case 'mousemove': {
			if (resizing.value) {
				const bounds = rootEl.value.getBoundingClientRect();
				const clientWidth = rootEl.value.clientWidth;
				const clientRight = bounds.left + clientWidth;
				const nextWidth = clientWidth + (ev.clientX - clientRight);
				emit('change:width', column.value, `${nextWidth}px`);
			}
			break;
		}
	}
}

function onHandleMouseUp(ev: MouseEvent) {
	switch (ev.type) {
		case 'mouseup': {
			if (resizing.value) {
				unregisterHandleMouseUp();
				unregisterHandleMouseMove();
				resizing.value = false;
				emit('operation:endWidthChange', column.value);
			}
			break;
		}
	}
}

function registerHandleMouseMove() {
	unregisterHandleMouseMove();
	addEventListener('mousemove', onHandleMouseMove);
}

function unregisterHandleMouseMove() {
	removeEventListener('mousemove', onHandleMouseMove);
}

function registerHandleMouseUp() {
	unregisterHandleMouseUp();
	addEventListener('mouseup', onHandleMouseUp);
}

function unregisterHandleMouseUp() {
	removeEventListener('mouseup', onHandleMouseUp);
}

function updateContentSize() {
	const clientWidth = contentEl.value?.clientWidth ?? 0;
	const clientHeight = contentEl.value?.clientHeight ?? 0;
	emit('change:contentSize', column.value, {
		// バーの横幅も考慮したいので、+3px
		width: clientWidth + 3 + 3,
		height: clientHeight,
	});
}

</script>

<style module lang="scss">
$handleWidth: 5px;

.cell {
	border-left: solid 0.5px var(--divider);
	cursor: pointer;
}

.root {
	display: flex;
	flex-direction: row;
	height: 100%;

	.wrapper {
		flex: 1;
		display: flex;
		flex-direction: row;
		overflow: hidden;
		justify-content: center;
	}

	.contentArea {
		display: flex;
		padding: 4px 0;
		overflow: hidden;
		white-space: nowrap;
		text-align: center;
	}

	.left {
		// rightのぶんだけズレるのでそれを相殺するためのネガティブマージン
		margin-left: -$handleWidth;
		margin-right: auto;
		width: $handleWidth;
		min-width: $handleWidth;
	}

	.right {
		margin-left: auto;
		// 判定を罫線の上に重ねたいのでネガティブマージンを使う
		margin-right: -$handleWidth;
		width: $handleWidth;
		min-width: $handleWidth;
		cursor: w-resize;
		z-index: 1;
	}
}
</style>
