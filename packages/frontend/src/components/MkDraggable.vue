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
	:class="[$style.items, { [$style.dragging]: dragging, [$style.horizontal]: direction === 'horizontal', [$style.vertical]: direction === 'vertical', [$style.withGaps]: withGaps }]"
>
	<slot name="header"></slot>
	<div
		v-for="(item, i) in modelValue"
		:key="item.id"
		:class="$style.item"
		:draggable="!manualDragStart"
		@dragstart="onDragstart($event, item)"
		@dragend="onDragend($event, item)"
	>
		<div
			:class="[$style.forwardArea, { [$style.dropReady]: dropReadyArea[0] === item && dropReadyArea[1] === 'forward' }]"
			@dragover.prevent.stop="onForwardDragover($event, item)"
			@dragleave="onForwardDragleave($event, item)"
			@drop.prevent.stop="onForwardDrop($event, item)"
		></div>
		<div style="position: relative; z-index: 0;">
			<slot :item="item"></slot>
		</div>
		<div
			:class="[$style.backwardArea, { [$style.dropReady]: dropReadyArea[0] === item && dropReadyArea[1] === 'backward' }]"
			@dragover.prevent.stop="onBackwardDragover($event, item)"
			@dragleave="onBackwardDragleave($event, item)"
			@drop.prevent.stop="onBackwardDrop($event, item)"
		></div>
	</div>
	<slot name="footer"></slot>
</TransitionGroup>
</template>

<script lang="ts" setup generic="T extends { id: string; }">
import { nextTick, ref } from 'vue';
import { getDragData, setDragData } from '@/drag-and-drop.js';

const slots = defineSlots<{
	default(props: { item: T }): any;
	header(): any;
	footer(): any;
}>();

const props = withDefaults(defineProps<{
	modelValue: T[];
	direction: 'horizontal' | 'vertical';
	group?: string | null;
	manualDragStart?: boolean;
	withGaps?: boolean;
}>(), {
	group: null,
	manualDragStart: false,
	withGaps: false,
});

const emit = defineEmits<{
	(ev: 'update:modelValue', value: T[]): void;
}>();

const dragging = ref(false);
const dropReadyArea = ref<[T['id'] | null, 'forward' | 'backward' | null]>([null, null]);
const group = props.group ?? Math.random().toString(36);

function onDragstart(ev: DragEvent, item: T) {
	if (ev.dataTransfer == null) return;
	ev.dataTransfer.effectAllowed = 'move';
	setDragData(ev, 'MkDraggable', item);

	// Chromeのバグで、Dragstartハンドラ内ですぐにDOMを変更する(=リアクティブなプロパティを変更する)とDragが終了してしまう
	// SEE: https://stackoverflow.com/questions/19639969/html5-dragend-event-firing-immediately
	window.setTimeout(() => {
		dragging.value = true;
	}, 10);
}

function onDragend(ev: DragEvent, item: T) {
	dragging.value = false;
	dropReadyArea.value = [null, null];
}

function onForwardDragover(ev: DragEvent, item: T) {
	nextTick(() => {
		dropReadyArea.value = [item.id, 'forward'];
	});
}

function onForwardDragleave(ev: DragEvent, item: T) {
	dropReadyArea.value = [null, null];
}

function onForwardDrop(ev: DragEvent, item: T) {
	const dragged = getDragData(ev, 'MkDraggable');
	dropReadyArea.value = [null, null];
	if (!dragged) return;
	if (dragged.id === item.id) return;

	const fromIndex = props.modelValue.findIndex(x => x.id === dragged.id);
	let toIndex = props.modelValue.findIndex(x => x.id === item.id);

	if (toIndex === -1) return;

	const newValue = [...props.modelValue];
	if (fromIndex > -1) newValue.splice(fromIndex, 1);
	toIndex = newValue.findIndex(x => x.id === item.id);
	newValue.splice(toIndex, 0, dragged as T);

	emit('update:modelValue', newValue);
}

function onBackwardDragover(ev: DragEvent, item: T) {
	nextTick(() => {
		dropReadyArea.value = [item.id, 'backward'];
	});
}

function onBackwardDragleave(ev: DragEvent, item: T) {
	dropReadyArea.value = [null, null];
}

function onBackwardDrop(ev: DragEvent, item: T) {
	const dragged = getDragData(ev, 'MkDraggable');
	dropReadyArea.value = [null, null];
	if (!dragged) return;
	if (dragged.id === item.id) return;

	const fromIndex = props.modelValue.findIndex(x => x.id === dragged.id);
	let toIndex = props.modelValue.findIndex(x => x.id === item.id);

	if (toIndex === -1) return;

	const newValue = [...props.modelValue];
	if (fromIndex > -1) newValue.splice(fromIndex, 1);
	toIndex = newValue.findIndex(x => x.id === item.id);
	newValue.splice(toIndex + 1, 0, dragged as T);

	emit('update:modelValue', newValue);
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

.items.vertical.withGaps .item {
	padding-top: calc(var(--MI-margin) / 2);
	padding-bottom: calc(var(--MI-margin) / 2);
}

.items.horizontal.withGaps .item {
	padding-left: calc(var(--MI-margin) / 2);
	padding-right: calc(var(--MI-margin) / 2);
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
</style>
