<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<TransitionGroup
	tag="div"
	:enterActiveClass="$style.transition_items_enterActive"
	:leaveActiveClass="$style.transition_items_leaveActive"
	:enterFromClass="$style.transition_items_enterFrom"
	:leaveToClass="$style.transition_items_leaveTo"
	:moveClass="$style.transition_items_move"
	:class="[$style.items, { [$style.dragging]: dragging, [$style.horizontal]: direction === 'horizontal', [$style.vertical]: direction === 'vertical', [$style.withGaps]: withGaps, [$style.canNest]: canNest }]"
>
	<slot name="header"></slot>
	<div
		v-if="modelValue.length === 0"
		:class="$style.emptyDropArea"
		@dragover.prevent.stop="() => {}"
		@dragleave="() => {}"
		@drop.prevent.stop="onEmptyDrop($event)"
	>
	</div>
	<div
		v-for="(item, i) in modelValue"
		:key="item.id"
		:class="$style.item"
		:draggable="!manualDragStart"
		@dragstart.stop="onDragstart($event, item)"
	>
		<div
			:class="[$style.forwardArea, { [$style.dropReady]: dropReadyArea[0] === item.id && dropReadyArea[1] === 'forward' }]"
			@dragover.prevent.stop="onDragover($event, item, false)"
			@dragleave="onDragleave($event, item)"
			@drop.prevent.stop="onDrop($event, item, false)"
		></div>
		<div style="position: relative; z-index: 0;">
			<slot :item="item" :index="i" :dragStart="(ev) => onDragstart(ev, item)"></slot>
		</div>
		<div
			:class="[$style.backwardArea, { [$style.dropReady]: dropReadyArea[0] === item.id && dropReadyArea[1] === 'backward' }]"
			@dragover.prevent.stop="onDragover($event, item, true)"
			@dragleave="onDragleave($event, item)"
			@drop.prevent.stop="onDrop($event, item, true)"
		></div>
	</div>
	<slot name="footer"></slot>
</TransitionGroup>
</template>

<script lang="ts">
import { ref } from 'vue';

// 別々のコンポーネントインスタンス間でD&Dを融通するためにグローバルに状態を持っておく必要がある
const dragging = ref(false);
let dropCallback: ((targetInstanceId: string) => void) | null = null;
</script>

<script lang="ts" setup generic="T extends { id: string; }">
import { nextTick } from 'vue';
import { getDragData, setDragData } from '@/drag-and-drop.js';
import { genId } from '@/utility/id.js';

const slots = defineSlots<{
	default(props: { item: T; index: number; dragStart: (ev: DragEvent) => void }): any;
	header(): any;
	footer(): any;
}>();

const props = withDefaults(defineProps<{
	modelValue: T[];
	direction: 'horizontal' | 'vertical';
	group?: string | null;
	manualDragStart?: boolean;
	withGaps?: boolean;
	canNest?: boolean;
}>(), {
	group: null,
	manualDragStart: false,
	withGaps: false,
	canNest: false,
});

const emit = defineEmits<{
	(ev: 'update:modelValue', value: T[]): void;
}>();

const dropReadyArea = ref<[T['id'] | null, 'forward' | 'backward' | null]>([null, null]);
const instanceId = genId();
const group = props.group ?? instanceId;

function onDragstart(ev: DragEvent, item: T) {
	if (ev.dataTransfer == null) return;
	ev.dataTransfer.effectAllowed = 'move';
	setDragData(ev, 'MkDraggable', { item, instanceId, group });

	const target = ev.target as HTMLElement;
	target.addEventListener('dragend', (ev) => {
		dragging.value = false;
		dropReadyArea.value = [null, null];
	}, { once: true });

	dropCallback = (targetInstanceId) => {
		if (targetInstanceId === instanceId) return;
		const newValue = props.modelValue.filter(x => x.id !== item.id);
		emit('update:modelValue', newValue);
	};

	// Chromeのバグで、Dragstartハンドラ内ですぐにDOMを変更する(=リアクティブなプロパティを変更する)とDragが終了してしまう
	// SEE: https://stackoverflow.com/questions/19639969/html5-dragend-event-firing-immediately
	window.setTimeout(() => {
		dragging.value = true;
	}, 10);
}

function onDragover(ev: DragEvent, item: T, backward: boolean) {
	nextTick(() => {
		dropReadyArea.value = [item.id, backward ? 'backward' : 'forward'];
	});
}

function onDragleave(ev: DragEvent, item: T) {
	dropReadyArea.value = [null, null];
}

function onDrop(ev: DragEvent, item: T, backward: boolean) {
	const dragged = getDragData(ev, 'MkDraggable');
	dropReadyArea.value = [null, null];
	if (dragged == null || dragged.group !== group || dragged.item.id === item.id) return;
	dropCallback?.(instanceId);

	const fromIndex = props.modelValue.findIndex(x => x.id === dragged.item.id);
	let toIndex = props.modelValue.findIndex(x => x.id === item.id);

	const newValue = [...props.modelValue];
	if (fromIndex > -1) newValue.splice(fromIndex, 1);
	toIndex = newValue.findIndex(x => x.id === item.id);
	if (backward) toIndex += 1;
	newValue.splice(toIndex, 0, dragged.item as T);

	emit('update:modelValue', newValue);
}

function onEmptyDrop(ev: DragEvent) {
	const dragged = getDragData(ev, 'MkDraggable');
	if (dragged == null) return;
	dropCallback?.(instanceId);

	emit('update:modelValue', [dragged.item as T]);
}
</script>

<style lang="scss" module>
.transition_items_move,
.transition_items_enterActive,
.transition_items_leaveActive {
	transition: all 0.15s ease;
}
.transition_items_enterFrom,
.transition_items_leaveTo {
	opacity: 0;
}
.transition_items_leaveActive {
	position: absolute;
}

.items {
	display: flex;
	align-items: center;
	justify-content: left;
	flex-wrap: wrap;
}

.items.horizontal {
	flex-direction: row;
}
.items.vertical {
	flex-direction: column;
}

.item {
	position: relative;
}

.items.vertical .item {
	width: 100%;
}

.items.horizontal.withGaps {
	row-gap: var(--MI-margin);
}

.items.horizontal.withGaps .item {
	padding-left: calc(var(--MI-margin) / 2);
	padding-right: calc(var(--MI-margin) / 2);
}

.items.vertical.withGaps .item {
	padding-top: calc(var(--MI-margin) / 2);
	padding-bottom: calc(var(--MI-margin) / 2);
}

.forwardArea, .backwardArea {
	position: absolute;
	z-index: 1;
	pointer-events: none;
}

.items.dragging {
	.forwardArea, .backwardArea {
		pointer-events: auto;
	}
}

.items.horizontal {
	.forwardArea {
		top: 0;
		left: 0;
		width: 50%;
		height: 100%;
	}

	.backwardArea {
		top: 0;
		right: 0;
		width: 50%;
		height: 100%;
	}
}

.items.vertical {
	.forwardArea {
		top: 0;
		left: 0;
		width: 100%;
		height: 50%;
	}

	.backwardArea {
		bottom: 0;
		left: 0;
		width: 100%;
		height: 50%;
	}
}

.items.canNest.horizontal {
	.forwardArea, .backwardArea {
		width: 30px;
	}
}

.items.canNest.vertical {
	.forwardArea, .backwardArea {
		height: 30px;
	}
}

.dropReady::before {
	content: '';
	position: absolute;
	z-index: 99999;
	background: var(--MI_THEME-accent);
	border-radius: 999px;
	pointer-events: none;
}

.items.horizontal {
	.forwardArea.dropReady::before {
		top: 0;
		left: -1px;
		width: 2px;
		height: 100%;
	}

	.backwardArea.dropReady::before {
		top: 0;
		right: -1px;
		width: 2px;
		height: 100%;
	}
}

.items.vertical {
	.forwardArea.dropReady::before {
		top: -1px;
		left: 0;
		width: 100%;
		height: 2px;
	}

	.backwardArea.dropReady::before {
		bottom: -1px;
		left: 0;
		width: 100%;
		height: 2px;
	}
}

.items.horizontal .emptyDropArea {
	width: 40px;
	height: 40px;
}

.items.vertical .emptyDropArea {
	width: 100%;
	height: 50px;
}
</style>
