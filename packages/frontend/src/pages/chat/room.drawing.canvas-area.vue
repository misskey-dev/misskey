<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	:class="$style.canvasContainer"
	@mousemove="handleMouseMove"
	@mouseup="handleMouseUp"
	@mouseleave="handleMouseLeave"
	@wheel="handleWheel"
>
	<!-- 背景白レイヤー（操作不可） -->
	<canvas
		:class="[$style.canvas, $style.backgroundLayer]"
		:width="canvasWidth"
		:height="canvasHeight"
		:style="{
			width: displayWidth + 'px',
			height: displayHeight + 'px',
			transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
			transformOrigin: `${zoomCenter.x}px ${zoomCenter.y}px`
		}"
	></canvas>

	<!-- メイン描画レイヤー（実際の描画） -->
	<canvas
		ref="mainCanvas"
		:class="[$style.canvas, $style.mainLayer]"
		:width="canvasWidth"
		:height="canvasHeight"
		:style="{
			width: displayWidth + 'px',
			height: displayHeight + 'px',
			transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
			transformOrigin: `${zoomCenter.x}px ${zoomCenter.y}px`
		}"
		@mousedown="handleMouseDown"
		@touchstart="handleTouchStart"
		@touchmove="handleTouchMove"
		@touchend="handleTouchEnd"
	></canvas>

	<!-- 他のユーザーのカーソル表示 -->
	<div
		v-for="cursor in otherCursors"
		:key="cursor.userId"
		:class="$style.otherCursor"
		:style="{
			left: cursor.x + 'px',
			top: cursor.y + 'px',
			transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
			transformOrigin: `${zoomCenter.x}px ${zoomCenter.y}px`
		}"
	>
		<div :class="$style.cursorDot" :style="{ backgroundColor: cursor.color }"></div>
		<div :class="$style.cursorLabel" :style="{ backgroundColor: cursor.color, color: getContrastColor(cursor.color) }">
			{{ cursor.userName }}
		</div>
	</div>

	<!-- ウォーターマーク -->
	<div v-if="showWatermark" :class="$style.watermark">
		{{ watermarkText }}
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import type { Point } from './room.drawing.types.js';

// Props
const props = defineProps<{
	canvasWidth: number;
	canvasHeight: number;
	displayWidth: number;
	displayHeight: number;
	panOffset: Point;
	zoomLevel: number;
	zoomCenter: Point;
	otherCursors: Array<{
		userId: string;
		userName: string;
		x: number;
		y: number;
		color: string;
	}>;
	showWatermark: boolean;
	watermarkText: string;
}>();

// Emits
const emit = defineEmits<{
	mousedown: [event: MouseEvent];
	mousemove: [event: MouseEvent];
	mouseup: [event: MouseEvent];
	mouseleave: [event: MouseEvent];
	touchstart: [event: TouchEvent];
	touchmove: [event: TouchEvent];
	touchend: [event: TouchEvent];
	wheel: [event: WheelEvent];
}>();

// Refs
const mainCanvas = ref<HTMLCanvasElement>();

// Methods
function handleMouseDown(event: MouseEvent) {
	emit('mousedown', event);
}

function handleMouseMove(event: MouseEvent) {
	emit('mousemove', event);
}

function handleMouseUp(event: MouseEvent) {
	emit('mouseup', event);
}

function handleMouseLeave(event: MouseEvent) {
	emit('mouseleave', event);
}

function handleTouchStart(event: TouchEvent) {
	emit('touchstart', event);
}

function handleTouchMove(event: TouchEvent) {
	emit('touchmove', event);
}

function handleTouchEnd(event: TouchEvent) {
	emit('touchend', event);
}

function handleWheel(event: WheelEvent) {
	emit('wheel', event);
}

function getContrastColor(backgroundColor: string): string {
	const hslMatch = backgroundColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
	if (hslMatch) {
		const lightness = parseInt(hslMatch[3]);
		return lightness > 55 ? '#000000' : '#ffffff';
	}
	return '#ffffff';
}

// Expose canvas element
defineExpose({
	mainCanvas
});
</script>

<style module lang="scss">
.canvasContainer {
	position: relative;
	flex: 1;
	overflow: hidden;
	background: #f5f5f5;
	cursor: crosshair;
	touch-action: none;
}

.canvas {
	position: absolute;
	top: 0;
	left: 0;
	image-rendering: pixelated;
	image-rendering: crisp-edges;
}

.backgroundLayer {
	background: white;
	z-index: 0;
}

.mainLayer {
	z-index: 1;
}

.otherCursor {
	position: absolute;
	pointer-events: none;
	z-index: 1000;
}

.cursorDot {
	width: 12px;
	height: 12px;
	border-radius: 50%;
	border: 2px solid white;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.cursorLabel {
	position: absolute;
	top: 16px;
	left: 16px;
	padding: 2px 6px;
	border-radius: 4px;
	font-size: 10px;
	font-weight: bold;
	white-space: nowrap;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.watermark {
	position: absolute;
	bottom: 20px;
	right: 20px;
	padding: 8px 16px;
	background: rgba(0, 0, 0, 0.1);
	color: rgba(0, 0, 0, 0.3);
	font-size: 12px;
	font-weight: bold;
	pointer-events: none;
	user-select: none;
	border-radius: 4px;
	z-index: 10;
}
</style>
