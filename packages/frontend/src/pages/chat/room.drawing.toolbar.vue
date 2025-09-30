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
			@click="$emit('setTool', 'pen')"
			title="鉛筆 (P)"
		>
			<i class="ti ti-pencil"></i>
		</button>
		<button
			:class="[$style.toolButton, { [$style.active]: currentTool === 'eraser' }]"
			@click="$emit('setTool', 'eraser')"
			title="消しゴム (E)"
		>
			<i class="ti ti-eraser"></i>
		</button>
		<button
			:class="[$style.toolButton, { [$style.active]: currentTool === 'eyedropper' }]"
			@click="$emit('setTool', 'eyedropper')"
			title="スポイト (I)"
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
			@click="$emit('openColorPicker')"
			title="カラーピッカーを開く"
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
			@click="$emit('setStrokeWidth', width)"
			:title="`線の太さ: ${width}px`"
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
	<div :class="$style.zoomGroup" v-if="isTouchDevice">
		<span :class="$style.label">倍率:</span>
		<span :class="$style.zoomDisplay">{{ Math.round(zoomLevel * 100) }}% ({{ Math.round(displayWidth * zoomLevel) }}×{{ Math.round(displayHeight * zoomLevel) }})</span>
		<button :class="$style.zoomButton" @click="$emit('zoomOut')" title="縮小 (-)">
			<i class="ti ti-zoom-out"></i>
		</button>
		<button :class="$style.zoomResetButton" @click="$emit('resetZoom')" title="倍率をリセット">
			<i class="ti ti-zoom-reset"></i>
		</button>
		<button :class="$style.zoomButton" @click="$emit('zoomIn')" title="拡大 (+)">
			<i class="ti ti-zoom-in"></i>
		</button>
		<button :class="$style.debugButton" @click="$emit('toggleDebug')" title="デバッグ情報">
			<i class="ti ti-bug"></i>
		</button>
		<button :class="$style.commLogButton" @click="$emit('exportCommLog')" title="通信ログ出力">
			<i class="ti ti-antenna-bars"></i>
		</button>
	</div>

	<!-- 手ブレ補正設定（モバイル版） -->
	<div :class="$style.touchCorrectionGroup" v-if="isTouchDevice">
		<span :class="$style.label">手ブレ補正:</span>
		<button
			:class="[$style.correctionButton, { [$style.active]: correctionEnabled }]"
			@click="$emit('toggleCorrection')"
			title="手ブレスムージング"
		>
			<i class="ti ti-wand"></i>
		</button>
		<div :class="$style.correctionLevelGroup" v-if="correctionEnabled">
			<span :class="$style.levelLabel">Lv:</span>
			<button
				v-for="level in correctionLevels"
				:key="level.level"
				:class="[$style.levelButton, { [$style.active]: correctionLevel === level.level }]"
				@click="$emit('setCorrectionLevel', level.level)"
				:title="`補正レベル ${level.level} (${level.name})`"
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
		<button :class="$style.layerMenuButton" @click="$emit('showLayerMenu')" title="レイヤーメニュー">
			<i class="ti ti-dots-vertical"></i>
		</button>
	</div>

	<!-- ウォーターマークボタン（モバイル版） -->
	<div :class="$style.watermarkGroup" v-if="isTouchDevice">
		<button
			:class="[$style.actionButton, { [$style.active]: showWatermark }]"
			@click="$emit('toggleWatermark')"
			title="ウォーターマーク"
		>
			<i class="ti ti-photo-shield"></i>
			<span>WM</span>
		</button>
	</div>

	<!-- Undo/Redoボタン -->
	<div :class="$style.undoRedoGroup">
		<button
			:class="[$style.undoButton, { [$style.disabled]: !canUndo }]"
			@click="$emit('undo')"
			:disabled="!canUndo"
			title="戻す (Ctrl+Z)"
		>
			<i class="ti ti-arrow-back-up"></i>
			<span v-if="!isTouchDevice">戻す</span>
		</button>
		<button
			:class="[$style.redoButton, { [$style.disabled]: !canRedo }]"
			@click="$emit('redo')"
			:disabled="!canRedo"
			title="やり直す (Ctrl+Y)"
		>
			<i class="ti ti-arrow-forward-up"></i>
			<span v-if="!isTouchDevice">やり直す</span>
		</button>
	</div>

	<!-- ズームグループ（PC版） -->
	<div :class="$style.zoomGroup" v-if="!isTouchDevice">
		<span :class="$style.label">倍率:</span>
		<span :class="$style.zoomDisplay">{{ Math.round(zoomLevel * 100) }}%</span>
		<button :class="$style.zoomButton" @click="$emit('zoomOut')" title="縮小 (-)">
			<i class="ti ti-zoom-out"></i>
		</button>
		<button :class="$style.zoomResetButton" @click="$emit('resetZoom')" title="倍率をリセット (Ctrl+0)">
			<i class="ti ti-zoom-reset"></i>
		</button>
		<button :class="$style.zoomButton" @click="$emit('zoomIn')" title="拡大 (+)">
			<i class="ti ti-zoom-in"></i>
		</button>
	</div>

	<!-- キャンバスサイズとアクションボタン -->
	<div :class="$style.actionGroup">
		<button :class="$style.sizeButton" @click="$emit('changeCanvasSize')" title="キャンバスサイズ変更">
			<i class="ti ti-dimensions"></i>
			<span v-if="!isTouchDevice">{{ canvasWidth }}×{{ canvasHeight }}</span>
		</button>
		<button :class="$style.clearButton" @click="$emit('clearCanvas')" title="キャンバスをクリア">
			<i class="ti ti-trash"></i>
			<span v-if="!isTouchDevice">クリア</span>
		</button>
		<button :class="$style.saveButton" @click="$emit('saveCanvas')" title="画像として保存">
			<i class="ti ti-download"></i>
			<span v-if="!isTouchDevice">保存</span>
		</button>
		<button :class="$style.fullscreenButton" @click="$emit('toggleFullscreen')" :title="isFullscreen ? '全画面を解除' : '全画面表示'">
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
