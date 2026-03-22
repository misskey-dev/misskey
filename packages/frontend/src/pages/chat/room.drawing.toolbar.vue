<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.toolbar">
	<!-- ツールグループ -->
	<div :class="$style.toolGroup">
		<button
			:class="[$style.toolButton, { [$style.active]: currentTool === 'pen' }]"
			title="鉛筆 (P)"
			@click="$emit('setTool', 'pen')"
		>
			<i class="ti ti-pencil"></i>
		</button>
		<button
			:class="[$style.toolButton, { [$style.active]: currentTool === 'eraser' }]"
			title="消しゴム (E)"
			@click="$emit('setTool', 'eraser')"
		>
			<i class="ti ti-eraser"></i>
		</button>
		<button
			:class="[$style.toolButton, { [$style.active]: currentTool === 'eyedropper' }]"
			title="スポイト (I)"
			@click="$emit('setTool', 'eyedropper')"
		>
			<span style="font-size: 16px;">🎨</span>
		</button>
	</div>

	<!-- カラーパレット -->
	<div :class="$style.colorPalette">
		<button
			v-for="color in colors"
			:key="color"
			:class="[$style.colorButton, { [$style.activeColor]: currentColor === color }]"
			:style="{ backgroundColor: color }"
			@click="$emit('setColor', color)"
		></button>
		<button
			:class="$style.colorPickerButton"
			title="カラーピッカーを開く"
			@click="$emit('openColorPicker')"
		>
			<i class="ti ti-palette"></i>
		</button>
	</div>

	<!-- 線の太さ調整 -->
	<div :class="$style.strokeWidthGroup">
		<span :class="$style.label">太さ:</span>
		<button
			v-for="width in strokeWidthLevels"
			:key="width"
			:class="[$style.strokeWidthButton, { [$style.active]: strokeWidth === width }]"
			:title="`線の太さ: ${width}px`"
			@click="$emit('setStrokeWidth', width)"
		>
			<div :class="$style.strokePreview" :style="{ width: `${Math.min(width * 2, 12)}px`, height: `${Math.min(width * 2, 12)}px` }"></div>
		</button>
	</div>

	<!-- 透明度調整 -->
	<div :class="$style.opacityGroup">
		<span :class="$style.label">透明度:</span>
		<button
			v-for="opacity in opacityLevels"
			:key="opacity"
			:class="[$style.opacityButton, { [$style.active]: currentOpacity === opacity }]"
			@click="$emit('setOpacity', opacity)"
		>
			{{ Math.round(opacity * 100) }}%
		</button>
	</div>

	<!-- 拡大縮小グループ -->
	<div v-if="isTouchDevice" :class="$style.zoomGroup">
		<span :class="$style.label">倍率:</span>
		<span :class="$style.zoomDisplay">{{ Math.round(zoomLevel * 100) }}% ({{ Math.round(displayWidth * zoomLevel) }}×{{ Math.round(displayHeight * zoomLevel) }})</span>
		<button :class="$style.zoomButton" title="縮小 (-)" @click="$emit('zoomOut')">
			<i class="ti ti-zoom-out"></i>
		</button>
		<button :class="$style.zoomResetButton" title="倍率をリセット" @click="$emit('resetZoom')">
			<i class="ti ti-zoom-reset"></i>
		</button>
		<button :class="$style.zoomButton" title="拡大 (+)" @click="$emit('zoomIn')">
			<i class="ti ti-zoom-in"></i>
		</button>
		<button :class="$style.debugButton" title="デバッグ情報" @click="$emit('toggleDebug')">
			<i class="ti ti-bug"></i>
		</button>
		<button :class="$style.commLogButton" title="通信ログ出力" @click="$emit('exportCommLog')">
			<i class="ti ti-antenna-bars"></i>
		</button>
	</div>

	<!-- 手ブレ補正設定（モバイル版） -->
	<div v-if="isTouchDevice" :class="$style.touchCorrectionGroup">
		<span :class="$style.label">手ブレ補正:</span>
		<button
			:class="[$style.correctionButton, { [$style.active]: correctionEnabled }]"
			title="手ブレスムージング"
			@click="$emit('toggleCorrection')"
		>
			<i class="ti ti-wand"></i>
		</button>
		<div v-if="correctionEnabled" :class="$style.correctionLevelGroup">
			<span :class="$style.levelLabel">Lv:</span>
			<button
				v-for="level in correctionLevels"
				:key="level.level"
				:class="[$style.levelButton, { [$style.active]: correctionLevel === level.level }]"
				:title="`補正レベル ${level.level} (${level.name})`"
				@click="$emit('setCorrectionLevel', level.level)"
			>
				{{ level.level }}
			</button>
		</div>
	</div>

	<!-- レイヤー切り替え -->
	<div :class="$style.layerGroup">
		<span :class="$style.label">レイヤー:</span>
		<button
			v-for="layer in maxLayers"
			:key="layer"
			:class="[$style.layerButton, { [$style.active]: currentLayer === layer - 1 }]"
			@click="$emit('switchLayer', layer - 1)"
		>
			{{ layer }}
		</button>
		<button :class="$style.layerMenuButton" title="レイヤーメニュー" @click="$emit('showLayerMenu')">
			<i class="ti ti-dots-vertical"></i>
		</button>
	</div>

	<!-- ウォーターマークボタン（モバイル版） -->
	<div v-if="isTouchDevice" :class="$style.watermarkGroup">
		<button
			:class="[$style.actionButton, { [$style.active]: showWatermark }]"
			title="ウォーターマーク"
			@click="$emit('toggleWatermark')"
		>
			<i class="ti ti-photo-shield"></i>
			<span>WM</span>
		</button>
	</div>

	<!-- Undo/Redoボタン -->
	<div :class="$style.undoRedoGroup">
		<button
			:class="[$style.undoButton, { [$style.disabled]: !canUndo }]"
			:disabled="!canUndo"
			title="戻す (Ctrl+Z)"
			@click="$emit('undo')"
		>
			<i class="ti ti-arrow-back-up"></i>
			<span v-if="!isTouchDevice">戻す</span>
		</button>
		<button
			:class="[$style.redoButton, { [$style.disabled]: !canRedo }]"
			:disabled="!canRedo"
			title="やり直す (Ctrl+Y)"
			@click="$emit('redo')"
		>
			<i class="ti ti-arrow-forward-up"></i>
			<span v-if="!isTouchDevice">やり直す</span>
		</button>
	</div>

	<!-- ズームグループ（PC版） -->
	<div v-if="!isTouchDevice" :class="$style.zoomGroup">
		<span :class="$style.label">倍率:</span>
		<span :class="$style.zoomDisplay">{{ Math.round(zoomLevel * 100) }}%</span>
		<button :class="$style.zoomButton" title="縮小 (-)" @click="$emit('zoomOut')">
			<i class="ti ti-zoom-out"></i>
		</button>
		<button :class="$style.zoomResetButton" title="倍率をリセット (Ctrl+0)" @click="$emit('resetZoom')">
			<i class="ti ti-zoom-reset"></i>
		</button>
		<button :class="$style.zoomButton" title="拡大 (+)" @click="$emit('zoomIn')">
			<i class="ti ti-zoom-in"></i>
		</button>
	</div>

	<!-- キャンバスサイズとアクションボタン -->
	<div :class="$style.actionGroup">
		<button :class="$style.sizeButton" title="キャンバスサイズ変更" @click="$emit('changeCanvasSize')">
			<i class="ti ti-dimensions"></i>
			<span v-if="!isTouchDevice">{{ canvasWidth }}×{{ canvasHeight }}</span>
		</button>
		<button :class="$style.clearButton" title="キャンバスをクリア" @click="$emit('clearCanvas')">
			<i class="ti ti-trash"></i>
			<span v-if="!isTouchDevice">クリア</span>
		</button>
		<button :class="$style.saveButton" title="画像として保存" @click="$emit('saveCanvas')">
			<i class="ti ti-download"></i>
			<span v-if="!isTouchDevice">保存</span>
		</button>
		<button :class="$style.fullscreenButton" :title="isFullscreen ? '全画面を解除' : '全画面表示'" @click="$emit('toggleFullscreen')">
			<i :class="isFullscreen ? 'ti ti-arrows-minimize' : 'ti ti-arrows-maximize'"></i>
			<span v-if="!isTouchDevice">{{ isFullscreen ? '解除' : '全画面' }}</span>
		</button>
	</div>
</div>
</template>

<script lang="ts" setup>
import type { ToolType, CorrectionLevel } from './room.drawing.types.js';

const props = defineProps<{
	currentTool: ToolType;
	currentColor: string;
	currentOpacity: number;
	strokeWidth: number;
	zoomLevel: number;
	displayWidth: number;
	displayHeight: number;
	canvasWidth: number;
	canvasHeight: number;
	currentLayer: number;
	maxLayers: number;
	isTouchDevice: boolean;
	canUndo: boolean;
	canRedo: boolean;
	isFullscreen: boolean;
	showWatermark: boolean;
	correctionEnabled: boolean;
	correctionLevel: number;
	colors: string[];
	strokeWidthLevels: number[];
	opacityLevels: number[];
	correctionLevels: CorrectionLevel[];
}>();

defineEmits<{
	setTool: [tool: ToolType];
	setColor: [color: string];
	setStrokeWidth: [width: number];
	setOpacity: [opacity: number];
	openColorPicker: [];
	zoomIn: [];
	zoomOut: [];
	resetZoom: [];
	toggleDebug: [];
	exportCommLog: [];
	toggleCorrection: [];
	setCorrectionLevel: [level: number];
	switchLayer: [layer: number];
	showLayerMenu: [];
	toggleWatermark: [];
	undo: [];
	redo: [];
	changeCanvasSize: [];
	clearCanvas: [];
	saveCanvas: [];
	toggleFullscreen: [];
}>();
</script>

<style lang="scss" module>
.toolbar {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
	padding: 12px;
	background: var(--MI_THEME-panel);
	border-bottom: 1px solid var(--MI_THEME-divider);
	align-items: center;
	position: sticky;
	top: 0;
	z-index: 10;
}

.toolGroup,
.colorPalette,
.strokeWidthGroup,
.opacityGroup,
.zoomGroup,
.touchCorrectionGroup,
.layerGroup,
.watermarkGroup,
.undoRedoGroup,
.actionGroup {
	display: flex;
	gap: 6px;
	align-items: center;
}

.label {
	font-size: 13px;
	color: var(--MI_THEME-fg);
	font-weight: 600;
	white-space: nowrap;
}

.toolButton,
.colorButton,
.strokeWidthButton,
.opacityButton,
.zoomButton,
.zoomResetButton,
.debugButton,
.commLogButton,
.correctionButton,
.levelButton,
.layerButton,
.layerMenuButton,
.actionButton,
.undoButton,
.redoButton,
.sizeButton,
.clearButton,
.saveButton,
.fullscreenButton {
	padding: 6px 10px;
	border: 1px solid var(--MI_THEME-divider);
	background: var(--MI_THEME-buttonBg);
	border-radius: 6px;
	cursor: pointer;
	transition: all 0.2s;
	font-size: 14px;
	display: flex;
	align-items: center;
	gap: 4px;
	min-width: 32px;
	justify-content: center;

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}

	&.active {
		background: var(--MI_THEME-accent);
		color: var(--MI_THEME-fgOnAccent);
		border-color: var(--MI_THEME-accent);
	}

	&.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
}

.colorButton {
	width: 28px;
	height: 28px;
	border-radius: 50%;
	padding: 0;
	border: 2px solid var(--MI_THEME-divider);

	&.activeColor {
		border-color: var(--MI_THEME-accent);
		border-width: 3px;
		box-shadow: 0 0 0 2px var(--MI_THEME-panel), 0 0 0 4px var(--MI_THEME-accent);
	}
}

.strokePreview {
	background: var(--MI_THEME-fg);
	border-radius: 50%;
}

.zoomDisplay {
	font-size: 13px;
	color: var(--MI_THEME-fg);
	font-family: monospace;
	min-width: 140px;
	text-align: center;
}

.correctionLevelGroup {
	display: flex;
	gap: 4px;
	align-items: center;
}

.levelLabel {
	font-size: 12px;
	color: var(--MI_THEME-fgTransparentWeak);
}
</style>
