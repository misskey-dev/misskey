<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[$style.root, 'drawing-root']">
	<!-- モバイル用ツールバー開閉ボタン -->
	<button
		v-if="isTouchDevice"
		:class="[$style.toolbarToggle, { [$style.toolbarToggleOpen]: isToolbarOpen }]"
		title="ツールバー"
		@click="isToolbarOpen = !isToolbarOpen"
	>
		<i :class="isToolbarOpen ? 'ti ti-x' : 'ti ti-tools'"></i>
	</button>

	<!-- ツールバー -->
	<div :class="[$style.toolbar, { [$style.toolbarMobile]: isTouchDevice, [$style.toolbarMobileOpen]: isTouchDevice && isToolbarOpen }]">
		<div :class="$style.toolGroup">
			<button
				:class="[$style.toolButton, { [$style.active]: currentTool === 'pen' }]"
				title="鉛筆"
				@click="setTool('pen')"
			>
				<i class="ti ti-pencil"></i>
			</button>
			<button
				:class="[$style.toolButton, { [$style.active]: currentTool === 'eraser' }]"
				title="消しゴム"
				@click="setTool('eraser')"
			>
				<i class="ti ti-eraser"></i>
			</button>
			<button
				:class="[$style.toolButton, { [$style.active]: currentTool === 'eyedropper' }]"
				title="スポイト"
				@click="setTool('eyedropper')"
			>
				<span style="font-size: 16px;">🎨</span>
			</button>
		</div>

		<!-- カラーパレット -->
		<div :class="$style.colorPalette">
			<button
				v-for="(color, index) in colors"
				:key="index"
				:class="[$style.colorButton, { [$style.activeColor]: currentColor === color }]"
				:style="{ backgroundColor: color }"
				@click="setColor(color, index)"
			></button>
			<button
				:class="$style.colorPickerButton"
				title="カラーピッカーを開く"
				@click="openColorPicker"
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
				@click="setStrokeWidth(width)"
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
				@click="setOpacity(opacity)"
			>
				{{ Math.round(opacity * 100) }}%
			</button>
		</div>

		<!-- 拡大縮小グループ -->
		<div v-if="isTouchDevice" :class="$style.zoomGroup">
			<span :class="$style.label">倍率:</span>
			<span :class="$style.zoomDisplay">{{ Math.round(zoomLevel * 100) }}% ({{ Math.round(displayWidth * zoomLevel) }}×{{ Math.round(displayHeight * zoomLevel) }})</span>
			<button :class="$style.zoomButton" title="縮小 (-)" @click="zoomOut">
				<i class="ti ti-zoom-out"></i>
			</button>
			<button :class="$style.zoomResetButton" title="倍率をリセット" @click="resetZoom">
				<i class="ti ti-zoom-reset"></i>
			</button>
			<button :class="$style.zoomButton" title="拡大 (+)" @click="zoomIn">
				<i class="ti ti-zoom-in"></i>
			</button>
			<button :class="$style.debugButton" title="デバッグ情報" @click="showDebugPanel = !showDebugPanel">
				<i class="ti ti-bug"></i>
			</button>
			<button :class="$style.commLogButton" title="通信ログ出力" @click="exportCommLog">
				<i class="ti ti-antenna-bars"></i>
			</button>
		</div>

		<!-- 手ブレ補正設定（モバイル版） -->
		<div v-if="isTouchDevice" :class="$style.touchCorrectionGroup">
			<span :class="$style.label">手ブレ補正:</span>
			<button
				:class="[$style.correctionButton, { [$style.active]: handShakeCorrection.enabled.value }]"
				title="手ブレスムージング"
				@click="handShakeCorrection.enabled.value = !handShakeCorrection.enabled.value"
			>
				<i class="ti ti-wand"></i>
			</button>
			<div v-if="handShakeCorrection.enabled.value" :class="$style.correctionLevelGroup">
				<span :class="$style.levelLabel">Lv:</span>
				<button
					v-for="level in correctionLevels"
					:key="level.level"
					:class="[$style.levelButton, { [$style.active]: handShakeCorrection.level.value === level.level }]"
					:title="`補正レベル ${level.level} (${level.name})`"
					@click="handShakeCorrection.level.value = level.level"
				>
					{{ level.level }}
				</button>
			</div>
		</div>

		<!-- レイヤー切り替え（モバイル版） -->
		<div v-if="isTouchDevice" :class="$style.layerGroup">
			<span :class="$style.label">レイヤー:</span>
			<button
				v-for="layer in MAX_LAYERS"
				:key="layer"
				:class="[$style.layerButton, { [$style.active]: currentLayer === layer - 1 }]"
				@click="switchLayer(layer - 1)"
			>
				{{ layer }}
			</button>
			<button :class="$style.layerMenuButton" title="レイヤーメニュー" @click="showLayerMenu">
				<i class="ti ti-dots-vertical"></i>
			</button>
		</div>

		<!-- ウォーターマークボタン（モバイル版） -->
		<div v-if="isTouchDevice" :class="$style.watermarkGroup">
			<button
				:class="[$style.actionButton, { [$style.active]: showWatermark }]"
				title="ウォーターマーク"
				@click="showWatermark = !showWatermark"
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
				@click="undo"
			>
				<i class="ti ti-arrow-back-up"></i>
				<span v-if="!isTouchDevice">戻す</span>
			</button>
			<button
				:class="[$style.redoButton, { [$style.disabled]: !canRedo }]"
				:disabled="!canRedo"
				title="やり直す (Ctrl+Y)"
				@click="redo"
			>
				<i class="ti ti-arrow-forward-up"></i>
				<span v-if="!isTouchDevice">やり直す</span>
			</button>
		</div>

		<!-- ズームグループ（PC版） -->
		<div v-if="!isTouchDevice" :class="$style.zoomGroup">
			<span :class="$style.label">倍率:</span>
			<span :class="$style.zoomDisplay">{{ Math.round(zoomLevel * 100) }}%</span>
			<button :class="$style.zoomButton" title="縮小 (-)" @click="zoomOut">
				<i class="ti ti-zoom-out"></i>
			</button>
			<button :class="$style.zoomResetButton" title="倍率をリセット (Ctrl+0)" @click="resetZoom">
				<i class="ti ti-zoom-reset"></i>
			</button>
			<button :class="$style.zoomButton" title="拡大 (+)" @click="zoomIn">
				<i class="ti ti-zoom-in"></i>
			</button>
		</div>

		<!-- レイヤー切り替え（PC版） -->
		<div v-if="!isTouchDevice" :class="$style.layerGroup">
			<span :class="$style.label">レイヤー:</span>
			<button
				v-for="layer in MAX_LAYERS"
				:key="layer"
				:class="[$style.layerButton, { [$style.active]: currentLayer === layer - 1 }]"
				@click="switchLayer(layer - 1)"
			>
				{{ layer }}
			</button>
			<button :class="$style.layerMenuButton" title="レイヤーメニュー" @click="showLayerMenu">
				<i class="ti ti-dots-vertical"></i>
			</button>
		</div>

		<!-- アクションボタン -->
		<div :class="$style.actionGroup">
			<button
				:class="[$style.actionButton, { [$style.active]: showWatermark }]"
				title="ウォーターマーク"
				@click="showWatermark = !showWatermark"
			>
				<i class="ti ti-photo-shield"></i>
				<span v-if="!isTouchDevice">WM</span>
			</button>
			<button :class="$style.fullscreenButton" :title="isFullscreen ? '全画面を終了' : '全画面モード'" @click="toggleFullscreen">
				<i :class="isFullscreen ? 'ti ti-minimize' : 'ti ti-maximize'"></i>
				<span v-if="!isTouchDevice">{{ isFullscreen ? '終了' : '全画面' }}</span>
			</button>
			<button :class="$style.settingsButton" title="キャンバスサイズ変更" @click="showCanvasSizeDialog">
				<i class="ti ti-adjustments"></i>
				<span v-if="!isTouchDevice">サイズ</span>
			</button>
			<button :class="$style.debugExportButton" title="デバッグログ出力（軌跡記録）" @click="exportDebugLog">
				<i class="ti ti-file-export"></i>
				<span v-if="!isTouchDevice">ログ出力</span>
			</button>
			<button :class="$style.commLogButton" title="通信ログ出力" @click="exportCommLog">
				<i class="ti ti-antenna-bars"></i>
				<span v-if="!isTouchDevice">通信ログ</span>
			</button>
			<button :class="$style.saveButton" title="キャンバスを保存" @click="saveCanvas">
				<i class="ti ti-device-floppy"></i>
				<span v-if="!isTouchDevice">保存</span>
			</button>
			<button :class="$style.clearButton" title="キャンバスをクリア" @click="clearCanvas">
				<i class="ti ti-trash"></i>
				<span v-if="!isTouchDevice">クリア</span>
			</button>
		</div>

		<!-- 手ブレ補正設定 -->
		<div v-if="!isTouchDevice" :class="$style.mouseCorrectionGroup">
			<span :class="$style.label">手ブレ補正:</span>
			<button
				:class="[$style.correctionButton, { [$style.active]: handShakeCorrection.enabled.value }]"
				title="手ブレスムージング"
				@click="handShakeCorrection.enabled.value = !handShakeCorrection.enabled.value"
			>
				<i class="ti ti-wand"></i>
			</button>
			<div v-if="handShakeCorrection.enabled.value" :class="$style.correctionLevelGroup">
				<span :class="$style.levelLabel">レベル:</span>
				<button
					v-for="level in correctionLevels"
					:key="level.level"
					:class="[$style.levelButton, { [$style.active]: handShakeCorrection.level.value === level.level }]"
					:title="`補正レベル ${level.level} (${level.name})`"
					@click="handShakeCorrection.level.value = level.level"
				>
					{{ level.level }}
				</button>
			</div>
			<button
				:class="[$style.correctionButton, { [$style.active]: handShakeCorrection.pressureSimulation.value }]"
				title="筆圧シミュレーション"
				@click="handShakeCorrection.pressureSimulation.value = !handShakeCorrection.pressureSimulation.value"
			>
				<i class="ti ti-brush"></i>
			</button>
			<button
				:class="[$style.correctionButton, { [$style.active]: handShakeCorrection.stabilization.value }]"
				title="手ぶれ補正"
				@click="handShakeCorrection.stabilization.value = !handShakeCorrection.stabilization.value"
			>
				<i class="ti ti-hand-stop"></i>
			</button>
		</div>
	</div>

	<!-- キャンバス -->
	<div
		ref="canvasContainerEl"
		:class="$style.canvasContainer"
		@mousemove="draw"
		@mouseup="stopDrawing"
		@mouseleave="stopDrawing"
		@wheel="handleWheel"
		@touchstart="handleContainerTouchStart"
		@touchmove="handleContainerTouchMove"
		@touchend="handleContainerTouchEnd"
	>
		<!-- デバッグパネル -->
		<div v-if="showDebugPanel" :class="$style.debugPanel">
			<div :class="$style.debugHeader">
				<h4>デバッグ情報</h4>
				<button :class="$style.debugCloseButton" @click="showDebugPanel = false">×</button>
			</div>
			<div :class="$style.debugContent">
				<div :class="$style.debugSection">
					<h5>📱 デバイス</h5>
					<p>DPR: {{ debugInfo.device.devicePixelRatio }}</p>
					<p>Type: {{ debugInfo.device.userAgent }}</p>
					<p>Touch: {{ debugInfo.device.touchDevice }}</p>
				</div>
				<div :class="$style.debugSection">
					<h5>📐 サイズ</h5>
					<p>物理: {{ debugInfo.sizes.physical }}</p>
					<p>CSS: {{ debugInfo.sizes.cssStyle }}</p>
					<p>表示: {{ debugInfo.sizes.actualDisplay }}</p>
					<p>論理: {{ debugInfo.sizes.logical }}</p>
					<p>描画域: {{ debugInfo.sizes.drawingArea }}</p>
				</div>
				<div :class="$style.debugSection">
					<h5>🎯 座標変換</h5>
					<p>スクリーン: {{ debugInfo.input.screen }}</p>
					<p>要素内: {{ debugInfo.input.element }}</p>
					<p>描画域: {{ debugInfo.input.drawing }}</p>
					<p>制限後: {{ debugInfo.input.clamped }}</p>
					<p>論理: {{ debugInfo.input.logical }}</p>
					<p>最終: {{ debugInfo.final.coordinates }}</p>
				</div>
				<div :class="$style.debugSection">
					<h5>⚖️ スケール・比率</h5>
					<p>描画スケール: {{ debugInfo.scales.drawingScale }}</p>
					<p>比率: {{ debugInfo.scales.aspectRatio }}</p>
					<p>オフセット: {{ debugInfo.scales.offset }}</p>
				</div>
				<div :class="$style.debugSection">
					<h5>🔄 変換</h5>
					<p>パン: {{ debugInfo.transform.panOffset }}</p>
					<p>ズーム: {{ debugInfo.transform.zoomLevel }}</p>
					<p>中心: {{ debugInfo.transform.zoomCenter }}</p>
					<p>基点: {{ debugInfo.transform.transformOrigin }}</p>
				</div>
				<div :class="$style.debugSection">
					<h5>👆 リアルタイム座標</h5>
					<p>状態: {{ realtimeCoords.isActive ? 'タッチ中' : '待機中' }}</p>
					<p>スクリーン: {{ realtimeCoords.screen }}</p>
					<p>キャンバス: {{ realtimeCoords.canvas }}</p>
				</div>
				<div :class="$style.debugSection">
					<h5>🕒 更新: {{ debugInfo.lastUpdate }}</h5>
				</div>
			</div>
		</div>

		<!-- 通信ログパネル -->
		<div v-if="showCommLogPanel" :class="$style.commLogPanel">
			<div :class="$style.commLogHeader">
				<h4>通信ログ</h4>
				<div :class="$style.commLogActions">
					<button :class="$style.commLogClearButton" @click="clearCommLog">クリア</button>
					<button :class="$style.commLogCloseButton" @click="showCommLogPanel = false">×</button>
				</div>
			</div>
			<div :class="$style.commLogContent">
				<div v-if="communicationLog.length === 0" :class="$style.commLogEmpty">
					通信ログがありません
				</div>
				<div
					v-for="(log, index) in communicationLog.slice().reverse()"
					:key="index"
					:class="[$style.commLogEntry, $style[`commLog${log.direction}`]]"
				>
					<div :class="$style.commLogTime">{{ formatTime(log.timestamp) }}</div>
					<div :class="$style.commLogType">
						<span :class="$style.commLogDirection">{{ log.direction === 'send' ? '送信' : '受信' }}</span>
						<span :class="$style.commLogEventType">{{ log.type }}</span>
					</div>
					<div :class="$style.commLogData">
						<pre>{{ formatLogData(log.data) }}</pre>
					</div>
				</div>
			</div>
		</div>
		<!-- 背景白レイヤー（操作不可） -->
		<canvas
			:class="[$style.canvas, $style.backgroundLayer]"
			:width="physicalCanvasWidth"
			:height="physicalCanvasHeight"
			:style="{
				width: displayWidth + 'px',
				height: displayHeight + 'px',
				transform: `translate(-50%, -50%) translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
				transformOrigin: 'center',
				transition: (isPanning || isZooming) ? 'none' : 'transform 0.2s ease'
			}"
		></canvas>
		<!-- レイヤーキャンバス（レイヤー3が一番下、レイヤー1が一番上） -->
		<canvas
			v-for="layerIndex in [2, 1, 0]"
			:key="`layer-${layerIndex}`"
			:ref="el => { if (el) layerCanvases[layerIndex] = el as HTMLCanvasElement }"
			:class="[$style.canvas, $style.layerCanvas]"
			:width="physicalCanvasWidth"
			:height="physicalCanvasHeight"
			:style="{
				width: displayWidth + 'px',
				height: displayHeight + 'px',
				transform: `translate(-50%, -50%) translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
				transformOrigin: 'center',
				transition: (isPanning || isZooming) ? 'none' : 'transform 0.2s ease',
				zIndex: MAX_LAYERS - layerIndex,
				opacity: layerVisible[layerIndex] ? layerOpacity[layerIndex] : 0,
				pointerEvents: layerIndex === currentLayer ? 'auto' : 'none'
			}"
			@mousedown="startDrawing"
		></canvas>

		<!-- ウォーターマーク（並べて表示） -->
		<div v-if="showWatermark" :class="$style.watermarkOverlay">
			<div :class="$style.watermarkTiles">
				<img
					v-for="i in 50"
					:key="i"
					:src="watermarkUrl"
					:class="$style.watermarkImage"
					alt="Oranski Nocturne"
				/>
			</div>
		</div>

		<!-- 他のユーザーのカーソル -->
		<div
			v-for="cursor in otherCursors"
			:key="cursor.userId"
			:class="$style.cursor"
			:style="{
				left: '50%',
				top: '50%',
				transform: `translate(-50%, -50%) translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel}) translate(${cursor.x - canvasWidth / 2}px, ${cursor.y - canvasHeight / 2}px)`,
				transformOrigin: 'center',
				color: getUserCursorColorLocal(cursor.userId)
			}"
		>
			<div :class="$style.cursorPointer"></div>
			<span
				:class="$style.cursorLabel"
				:style="{
					background: getUserCursorColorLocal(cursor.userId),
					color: getContrastColorLocal(getUserCursorColorLocal(cursor.userId))
				}"
			>
				{{ cursor.userName }}
			</span>
		</div>
	</div>

	<!-- チャットオーバーレイ -->
	<Transition name="chat-overlay">
		<div v-if="chatOverlay" :class="$style.chatOverlay">
			<div :class="$style.chatBubble">
				<MkAvatar :class="$style.chatAvatar" :user="chatOverlay.user" :size="24"/>
				<div :class="$style.chatText">{{ chatOverlay.text }}</div>
			</div>
		</div>
	</Transition>
</div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount, computed, nextTick } from 'vue';
import { defineAsyncComponent } from 'vue';
// 分離したコンポーネントをインポート
import DrawingToolbar from './room.drawing.toolbar.vue';
import DrawingDebugPanel from './room.drawing.debug.vue';
// 分離したモジュールをインポート
import { screenToCanvasCoordinates, getActualDrawingArea } from './room.drawing.coordinates.js';
import {
	drawSmoothPath,
	applyHandShakeCorrection,
	simulatePressureFromVelocity,
	getUserCursorColor,
	getContrastColor,
} from './room.drawing.canvas.js';
// 新規作成したComposableをインポート
import { useDrawingHandlers } from './room.drawing.handlers.js';
import { useDrawingRender } from './room.drawing.render.js';
import { useDrawingLayers } from './room.drawing.layers.js';
import { useDrawingNetwork } from './room.drawing.network.js';
// ユーティリティ関数をインポート
import {
	applyHandShakeCorrection as applyHandShakeCorrectionUtil,
	calculatePressure as calculatePressureUtil,
	simplifyPath as simplifyPathUtil,
	smoothPoints as smoothPointsUtil,
	getAccurateCoordinates as getAccurateCoordinatesUtil,
	formatTime as formatTimeUtil,
	formatLogData as formatLogDataUtil,
} from './room.drawing.utils.js';
// キャンバスエリアコンポーネントをインポート
import DrawingCanvasArea from './room.drawing.canvas-area.vue';
// 分離したComposableをインポート
import {
	useDrawing,
	useDrawingConnection,
	useCanvasOperations,
	useZoomPan,
	useUndoRedo,
	useDrawingUtils,
	useToolState,
} from './room.drawing.composables.js';
import {
	useGestures,
	useKeyboard,
	useWheel,
} from './room.drawing.gestures.js';
import type {
	ToolType,
	Point,
	PressurePoint,
	StrokeData,
	DrawingTraceLog,
	CommunicationLog,
	CanvasSize,
	DebugInfo,
	RealtimeCoords,
	CorrectionLevel,
} from './room.drawing.types.js';
import MkAvatar from '@/components/global/MkAvatar.vue';
import { misskeyApi } from '@/utility/misskey-api.js';
import * as os from '@/os.js';
import { ensureSignin } from '@/i.js';
import { useStream } from '@/stream.js';

const props = defineProps<{
	roomId?: string;
	userId?: string;
}>();

const $i = ensureSignin();

// 描画ID (roomId または userId-$i.id のいずれかを使用)
const drawingId = computed(() => {
	if (props.roomId) {
		return props.roomId;
	} else if (props.userId) {
		// 1対1チャットの場合は、小さいユーザーIDを先に置いて一意にする
		const userIds = [props.userId, $i.id].sort();
		return `user-${userIds[0]}-${userIds[1]}`;
	} else {
		throw new Error('roomId or userId is required');
	}
});

// キャンバス関連
const canvasEl = ref<HTMLCanvasElement>();
const canvasContainerEl = ref<HTMLDivElement>();
const canvasWidth = ref(800); // 800x600の標準サイズ（可変）
const canvasHeight = ref(600);
const displayWidth = ref(800); // 表示サイズ（固定）
const displayHeight = ref(600);

// DPR考慮した物理サイズ（テンプレートバインド用）
const physicalCanvasWidth = computed(() => {
	const dpr = window.devicePixelRatio || 1;
	return canvasWidth.value * dpr;
});
const physicalCanvasHeight = computed(() => {
	const dpr = window.devicePixelRatio || 1;
	return canvasHeight.value * dpr;
});

let ctx: CanvasRenderingContext2D | null = null;

// キャンバスサイズプリセット
const canvasSizePresets = [
	{ name: '標準 (800×600)', width: 800, height: 600 },
	{ name: '正方形小 (600×600)', width: 600, height: 600 },
	{ name: '正方形大 (1000×1000)', width: 1000, height: 1000 },
	{ name: 'HD (1280×720)', width: 1280, height: 720 },
	{ name: 'Full HD (1920×1080)', width: 1920, height: 1080 },
	{ name: 'A4縦 (595×842)', width: 595, height: 842 },
	{ name: 'A4横 (842×595)', width: 842, height: 595 },
];

// 軌跡記録用のログ
const drawingTraceLog = ref<Array<{
	timestamp: number;
	type: 'touchstart' | 'touchmove' | 'touchend' | 'mousedown' | 'mousemove' | 'mouseup';
	screenX: number;
	screenY: number;
	canvasX: number;
	canvasY: number;
	tool: string;
	color: string;
	strokeWidth: number;
	zoomLevel: number;
	panOffset: { x: number; y: number };
}>>([]);

// ウォーターマーク設定
const showWatermark = ref(false);
const watermarkUrl = 'https://noc.ski/files/5f672682-73ab-484f-adb8-37e7e4bc0a4c';

// 通信ログ用
const showCommLogPanel = ref(false);
const communicationLog = ref<Array<{
	timestamp: number;
	direction: 'send' | 'receive';
	type: string;
	data: any;
}>>([]);
const MAX_COMM_LOG_ENTRIES = 100;

// 描画状態
const isDrawing = ref(false);
const currentTool = ref<'pen' | 'eraser' | 'eyedropper'>('pen');
const currentColor = ref('#000000');
const currentColorIndex = ref(0); // 現在選択中のカラーパレットのインデックス
const currentOpacity = ref(1);
const strokeWidth = ref(2);

// ツール別の線の太さを記憶
const toolStrokeWidths = ref({
	pen: 2,
	eraser: 10,
});

// 全画面モード
const isFullscreen = ref(false);

// タッチデバイス検出
const isTouchDevice = ref(false);

// ツールバー開閉状態（モバイル専用）
const isToolbarOpen = ref(false);

// デバッグ用状態
let debugLogCount = 0;
const showDebugPanel = ref(false);
const debugInfo = ref<DebugInfo>({
	device: {},
	sizes: {},
	input: {},
	scales: {},
	transform: {},
	final: {},
	lastUpdate: '',
});

// リアルタイム座標表示用
const realtimeCoords = ref({
	screen: '(0, 0)',
	canvas: '(0, 0)',
	isActive: false,
});

// パン（移動）状態
const isPanning = ref(false);
const panOffset = ref({ x: 0, y: 0 });
const panStart = ref({ x: 0, y: 0 });
const lastTouchDistance = ref(0);
const isSpaceKeyPressed = ref(false); // スペースキー押下状態
const isPanningWithSpace = ref(false); // スペースキーでのパン中

// ズーム（拡大縮小）状態
const zoomLevel = ref(1);
const zoomCenter = ref({ x: 0, y: 0 });
const minZoom = 0.5;
const maxZoom = 10.0;
const isZooming = ref(false);

// ジェスチャー状態管理
const gestureState = ref<'none' | 'pan' | 'zoom' | 'hybrid'>('none');
const initialDistance = ref(0);
const distanceHistory = ref<number[]>([]);
const panThreshold = 5; // パン開始の最小移動距離
const zoomThreshold = 15; // ズーム開始の最小距離変化

// アンドゥ用ダブルタップ検出
const lastTwoFingerTap = ref(0);
const twoFingerTapTimeout = 500; // ダブルタップの間隔（ms）
const twoFingerTapStartPos = ref<Point | null>(null);
const tapMoveThreshold = 20; // タップ判定の最大移動距離（ピクセル）

// 手ブレ補正設定
const handShakeCorrection = {
	enabled: ref(true),
	level: ref(3), // 補正レベル 1-5 (1:最弱, 5:最強)
	pressureSimulation: ref(true), // 筆圧シミュレーション
	stabilization: ref(true), // 手ぶれ補正
};

// 手ブレ補正レベル設定
const correctionLevels = [
	{ level: 1, name: '最弱', factor: 0.3, minDistance: 0.5, velocitySmoothing: 0.3 },
	{ level: 2, name: '弱', factor: 0.5, minDistance: 1, velocitySmoothing: 0.5 },
	{ level: 3, name: '標準', factor: 0.7, minDistance: 1.5, velocitySmoothing: 0.7 },
	{ level: 4, name: '強', factor: 0.85, minDistance: 2, velocitySmoothing: 0.85 },
	{ level: 5, name: '最強', factor: 0.95, minDistance: 3, velocitySmoothing: 0.95 },
];

// 現在の補正レベル設定を取得
const getCurrentCorrectionSettings = () => {
	return correctionLevels[handShakeCorrection.level.value - 1];
};

// 手ブレ補正用の状態
let smoothedPoint = { x: 0, y: 0 };
let lastPoint = { x: 0, y: 0 };
let velocity = 0;
let lastTime = 0;
const velocityHistory: number[] = [];
const pointBuffer: Array<{ x: number; y: number; time: number }> = [];

// リアルタイム描画同期用
let lastProgressSent = 0;
const progressSendInterval = 50; // 50ms間隔で進行状況を送信

// 座標計算精度向上用
let canvasRect = ref<DOMRect | null>(null);
let resizeObserver: ResizeObserver | null = null;

// カラーパレット（濃いめ）
const colors = ref([
	'#000000', // 黒
	'#FFFFFF', // 白
	'#E74C3C', // 赤
	'#27AE60', // 緑
	'#3498DB', // 青
	'#F39C12', // オレンジ
	'#9B59B6', // 紫
	'#1ABC9C', // ターコイズ
	'#E67E22', // カロット
	'#2ECC71', // エメラルド
	'#5DADE2', // スカイブルー
	'#F4D03F', // 黄色
	'#AF7AC5', // アメジスト
	'#48C9B0', // アクアマリン
	'#95A5A6', // グレー
	'#7F8C8D', // ダークグレー
]);

// 透明度レベル
const opacityLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

// 線の太さレベル
const strokeWidthLevels = [1, 1.5, 2, 10, 50, 100];

// パフォーマンス管理
const maxUndoHistory = 20; // アンドゥ履歴の最大数
const strokeHistory = ref<Array<any>>([]); // ストローク履歴
const rasterizeThreshold = 50; // ラスタライズを実行するストローク数

// Undo/Redo管理
const undoStack = ref<Array<any>>([]); // 元に戻す用のスタック
const redoStack = ref<Array<any>>([]); // やり直す用のスタック
const canUndo = computed(() => undoStack.value.length > 0);
const canRedo = computed(() => redoStack.value.length > 0);

// レイヤー管理（3レイヤー）
const MAX_LAYERS = 3;
const currentLayer = ref(0); // 現在のレイヤー (0, 1, 2)
const layerCanvases = ref<Array<HTMLCanvasElement | undefined>>([undefined, undefined, undefined]); // 各レイヤーのキャンバス
const layerContexts = ref<Array<CanvasRenderingContext2D | null>>([null, null, null]); // 各レイヤーのコンテキスト
const layerVisible = ref<Array<boolean>>([true, true, true]); // 各レイヤーの表示状態
const layerOpacity = ref<Array<number>>([1.0, 1.0, 1.0]); // 各レイヤーの透明度
const layerStrokeHistory = ref<Array<Array<any>>>([[], [], []]); // 各レイヤーのストローク履歴

function clampLayerIndex(layer: unknown): number {
	const numeric = typeof layer === 'number' && Number.isFinite(layer) ? Math.floor(layer) : 0;
	return Math.min(Math.max(numeric, 0), MAX_LAYERS - 1);
}

function withLayerContext(layerIndex: number, fn: (context: CanvasRenderingContext2D) => void) {
	const targetContext = layerContexts.value[layerIndex];
	if (!targetContext) return;
	const previousCtx = ctx;
	ctx = targetContext;
	try {
		fn(targetContext);
	} finally {
		ctx = previousCtx;
	}
}

function normalizeStrokeForHistory(stroke: any) {
	const layer = clampLayerIndex(stroke?.layer);
	const rawPoints = Array.isArray(stroke?.points) ? stroke.points : [];
	const points = rawPoints
		.filter(point => point && typeof point.x === 'number' && typeof point.y === 'number')
		.map(point => ({
			x: point.x,
			y: point.y,
			pressure: typeof point.pressure === 'number' ? point.pressure : undefined,
		}));

	if (points.length === 0) return null;

	const strokeWidth = typeof stroke?.strokeWidth === 'number' && Number.isFinite(stroke.strokeWidth)
		? Math.max(1, Math.min(100, stroke.strokeWidth))
		: 1;
	const opacity = typeof stroke?.opacity === 'number' && Number.isFinite(stroke.opacity)
		? Math.min(Math.max(stroke.opacity, 0), 1)
		: 1;

	return {
		id: typeof stroke?.id === 'string' ? stroke.id : undefined,
		userId: stroke?.userId ?? null,
		userName: stroke?.userName ?? null,
		tool: ['pen', 'eraser', 'eyedropper'].includes(stroke?.tool) ? stroke.tool : 'pen',
		color: typeof stroke?.color === 'string' ? stroke.color : '#000000',
		strokeWidth,
		opacity,
		timestamp: typeof stroke?.timestamp === 'number' ? stroke.timestamp : Date.now(),
		layer,
		points,
	};
}

function renderStrokeOnLayer(
	stroke: any,
	options: { skipIfSelf?: boolean; updateHistory?: boolean; suppressRender?: boolean } = {},
) {
	const normalized = normalizeStrokeForHistory(stroke);
	if (!normalized) return null;

	if (options.skipIfSelf && normalized.userId && normalized.userId === $i.id) {
		return null;
	}

	if (!options.suppressRender) {
		withLayerContext(normalized.layer, () => {
			if (!ctx) return;
			if (normalized.points.length === 1) {
				const point = normalized.points[0];
				ctx.save();
				ctx.globalCompositeOperation = normalized.tool === 'eraser' ? 'destination-out' : 'source-over';
				ctx.fillStyle = normalized.tool === 'eraser' ? '#000000' : normalized.color;
				ctx.globalAlpha = normalized.opacity;
				ctx.beginPath();
				ctx.arc(point.x, point.y, normalized.strokeWidth / 2, 0, Math.PI * 2);
				ctx.fill();
				ctx.restore();
				return;
			}

			drawSmoothPathLocal(
				normalized.points,
				normalized.strokeWidth,
				normalized.color,
				normalized.opacity,
				normalized.tool === 'eraser',
			);
		});
	}

	if (options.updateHistory !== false) {
		if (!Array.isArray(layerStrokeHistory.value[normalized.layer])) {
			layerStrokeHistory.value[normalized.layer] = [];
		}
		layerStrokeHistory.value[normalized.layer].push(normalized);
	}

	return normalized;
}

// WebSocket接続
const connection = ref<any>();

// 他のユーザーのカーソル
const otherCursors = ref<Array<{
	userId: string;
	userName: string;
	x: number;
	y: number;
	color: string;
}>>([]);

// 他のユーザーの描画中ストローク
const otherActiveStrokes = ref<Map<string, {
	points: Array<{ x: number; y: number }>;
	tool: string;
	color: string;
	strokeWidth: number;
	opacity: number;
	userId: string;
}>>(new Map());

// チャットオーバーレイ
const chatOverlay = ref<{
	user: any;
	text: string;
} | null>(null);

// 現在の描画パス
let currentPath: Array<{ x: number; y: number }> = [];

// 設定保存用デバウンスタイマー
let saveSettingsTimer: number | null = null;

// ユーザー設定を読み込む
async function loadUserSettings() {
	try {
		const settings = await misskeyApi('drawing/settings/user/get', {
			canvasId: drawingId.value,
		});

		if (settings) {
			currentTool.value = settings.currentTool;
			currentColor.value = settings.currentColor;
			currentOpacity.value = settings.currentOpacity;
			strokeWidth.value = settings.strokeWidth;
			currentLayer.value = settings.currentLayer;
			layerVisible.value = settings.layerVisible;
			layerOpacity.value = settings.layerOpacity;
			zoomLevel.value = settings.zoomLevel;
			panOffset.value.x = settings.panOffsetX;
			panOffset.value.y = settings.panOffsetY;
			// カラーパレットを復元（保存されている場合）
			if (settings.colors && Array.isArray(settings.colors)) {
				colors.value = settings.colors;
			}
		}
	} catch (error) {
		console.error('❌ [SETTINGS] Failed to load user settings:', error);
	}
}

// ルーム設定を読み込む
async function loadRoomSettings() {
	try {
		const settings = await misskeyApi('drawing/settings/room/get', {
			canvasId: drawingId.value,
		});

		if (settings) {
			canvasWidth.value = settings.canvasWidth;
			canvasHeight.value = settings.canvasHeight;
		}
	} catch (error) {
		console.error('❌ [SETTINGS] Failed to load room settings:', error);
	}
}

// ルーム設定を保存する
async function saveRoomSettings() {
	try {
		await misskeyApi('drawing/settings/room/update', {
			canvasId: drawingId.value,
			canvasWidth: canvasWidth.value,
			canvasHeight: canvasHeight.value,
		});
	} catch (error) {
		console.error('❌ [SETTINGS] Failed to save room settings:', error);
	}
}

// ユーザー設定を保存する（デバウンス付き）
function saveUserSettings() {
	if (saveSettingsTimer !== null) {
		window.clearTimeout(saveSettingsTimer);
	}

	saveSettingsTimer = window.setTimeout(async () => {
		try {
			await misskeyApi('drawing/settings/user/update', {
				canvasId: drawingId.value,
				currentTool: currentTool.value,
				currentColor: currentColor.value,
				currentOpacity: currentOpacity.value,
				strokeWidth: strokeWidth.value,
				currentLayer: currentLayer.value,
				layerVisible: layerVisible.value,
				layerOpacity: layerOpacity.value,
				zoomLevel: zoomLevel.value,
				panOffsetX: panOffset.value.x,
				panOffsetY: panOffset.value.y,
				colors: colors.value, // カラーパレットを保存
			});
		} catch (error) {
			console.error('❌ [SETTINGS] Failed to save user settings:', error);
		}
	}, 1000); // 1秒のデバウンス
}

onMounted(async () => {
	// ルーム設定を読み込む（キャンバスサイズ）
	// テンプレートのバインディングが適用される前に読み込む必要がある
	await loadRoomSettings();

	// 次のフレームで実行（テンプレートのバインディングが適用された後）
	await nextTick();

	// コンテナサイズに合わせてdisplayサイズを更新
	updateDisplaySize();

	// レイヤーキャンバスの初期化
	const dpr = window.devicePixelRatio || 1;

	// canvasElに現在のアクティブレイヤーのcanvasを設定
	// （イベントリスナーやカーソルスタイル変更用）
	canvasEl.value = layerCanvases.value[currentLayer.value];

	for (let i = 0; i < MAX_LAYERS; i++) {
		const canvas = layerCanvases.value[i];
		if (canvas) {
			const context = canvas.getContext('2d', {
				alpha: true,
				desynchronized: false,
				colorSpace: 'srgb',
				willReadFrequently: false,
			});

			if (context) {
				// DPR対応でスケール調整
				context.scale(dpr, dpr);

				// 最高品質のアンチエイリアス設定
				context.lineCap = 'round';
				context.lineJoin = 'round';
				context.imageSmoothingEnabled = true;
				context.imageSmoothingQuality = 'high';

				// より滑らかな描画のための最適化設定
				context.globalCompositeOperation = 'source-over';
				context.miterLimit = 10;
				context.lineWidth = 2;
				context.filter = 'none';

				layerContexts.value[i] = context;
			}
		}
	}

	// 現在のレイヤーのコンテキストを設定
	ctx = layerContexts.value[currentLayer.value];

	// タッチデバイス検出
	isTouchDevice.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

	// タッチデバイスの場合、初期ストローク幅を太くする（ユーザーが変更していない場合のみ）
	if (isTouchDevice.value && strokeWidth.value === 2) {
		strokeWidth.value = 4;
		// ペンツールの太さも同期
		toolStrokeWidths.value.pen = 4;
	}

	// WebSocket接続（統合）
	connectToChatRoomChannel();

	// 既存のキャンバスデータを復元
	loadCanvasData();

	// ユーザー設定を読み込む
	await loadUserSettings();

	// 全画面モード用のイベントリスナー
	document.addEventListener('fullscreenchange', handleFullscreenChange);

	// キャンバスサイズ変更監視でより正確な座標計算
	if (canvasEl.value && 'ResizeObserver' in window) {
		canvasRect.value = canvasEl.value.getBoundingClientRect();
		resizeObserver = new ResizeObserver(() => {
			if (canvasEl.value) {
				const rect = canvasEl.value.getBoundingClientRect();
				canvasRect.value = rect;
				// displayWidth/displayHeightは固定値を維持し、ResizeObserverでは更新しない
				// transformによるサイズ変化を拾わないようにする
			}
		});
		resizeObserver.observe(canvasEl.value);
	}

	// デフォルトカーソルを設定
	if (canvasEl.value) {
		canvasEl.value.style.cursor = 'crosshair';
	}

	// キーボードショートカット
	const handleKeyDown = (e: KeyboardEvent) => {
		const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
		const ctrlKey = isMac ? e.metaKey : e.ctrlKey;

		// スペースキー: パンモード開始
		if (e.key === ' ' && !e.repeat && !isTouchDevice.value) {
			e.preventDefault();
			isSpaceKeyPressed.value = true;
			if (canvasEl.value) {
				canvasEl.value.style.cursor = 'grab';
			}
		}
		// P: ペンツール
		else if (e.key === 'p' || e.key === 'P') {
			e.preventDefault();
			setTool('pen');
		}
		// E: 消しゴムツール
		else if (e.key === 'e' || e.key === 'E') {
			e.preventDefault();
			setTool('eraser');
		}
		// I: スポイトツール
		else if (e.key === 'i' || e.key === 'I') {
			e.preventDefault();
			setTool('eyedropper');
		}
		// Ctrl+Z / Cmd+Z: Undo
		else if (ctrlKey && e.key === 'z' && !e.shiftKey) {
			e.preventDefault();
			undo();
		}
		// Ctrl+Y / Cmd+Y または Ctrl+Shift+Z / Cmd+Shift+Z: Redo
		else if (ctrlKey && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
			e.preventDefault();
			redo();
		}
		// Ctrl+0 / Cmd+0: ズームをリセット
		else if (ctrlKey && e.key === '0') {
			e.preventDefault();
			resetZoom();
		}
	};

	const handleKeyUp = (e: KeyboardEvent) => {
		// スペースキー: パンモード終了
		if (e.key === ' ' && !isTouchDevice.value) {
			isSpaceKeyPressed.value = false;
			isPanningWithSpace.value = false;
			if (canvasEl.value) {
				canvasEl.value.style.cursor = 'crosshair';
			}
		}
	};

	// マウスホイールでズーム（PC版のみ）
	const handleWheel = (e: WheelEvent) => {
		if (isTouchDevice.value) return;

		const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
		const ctrlKey = isMac ? e.metaKey : e.ctrlKey;

		// Ctrl/Cmdキーを押しながらホイール操作でズーム
		if (ctrlKey) {
			e.preventDefault();

			const delta = e.deltaY > 0 ? -0.1 : 0.1;
			const newZoom = Math.max(minZoom, Math.min(maxZoom, zoomLevel.value + delta));

			if (newZoom !== zoomLevel.value) {
				// マウス位置を中心にズーム
				// 現在のズーム前の論理座標を取得
				const beforeZoomCoords = screenToCanvasCoordinates(
					e.clientX,
					e.clientY,
					layerCanvases.value[currentLayer.value] || null,
					canvasWidth.value,
					canvasHeight.value,
					displayWidth.value,
					displayHeight.value,
					panOffset.value,
					zoomLevel.value,
					zoomCenter.value,
					isTouchDevice.value,
				);

				// ズームレベルを更新
				const oldZoom = zoomLevel.value;
				zoomLevel.value = newZoom;

				// ズーム後の論理座標を取得
				const afterZoomCoords = screenToCanvasCoordinates(
					e.clientX,
					e.clientY,
					layerCanvases.value[currentLayer.value] || null,
					canvasWidth.value,
					canvasHeight.value,
					displayWidth.value,
					displayHeight.value,
					panOffset.value,
					zoomLevel.value,
					zoomCenter.value,
					isTouchDevice.value,
				);

				// マウス位置が変わらないようにパンオフセットを調整
				const offsetDeltaX = afterZoomCoords.x - beforeZoomCoords.x;
				const offsetDeltaY = afterZoomCoords.y - beforeZoomCoords.y;

				panOffset.value = {
					x: panOffset.value.x - offsetDeltaX,
					y: panOffset.value.y - offsetDeltaY,
				};
			}
		}
	};

	document.addEventListener('keydown', handleKeyDown);
	document.addEventListener('keyup', handleKeyUp);
	if (canvasEl.value) {
		canvasEl.value.addEventListener('wheel', handleWheel, { passive: false });
	}

	// ウィンドウリサイズ時にdisplayサイズを更新
	window.addEventListener('resize', updateDisplaySize);

	// 定期的なパフォーマンス監視（30秒間隔）
	const performanceMonitor = setInterval(() => {
		monitorPerformance();
	}, 30000);

	// コンポーネント終了時にクリア
	onBeforeUnmount(() => {
		clearInterval(performanceMonitor);
		document.removeEventListener('keydown', handleKeyDown);
		document.removeEventListener('keyup', handleKeyUp);
		window.removeEventListener('resize', updateDisplaySize);
		if (canvasEl.value) {
			canvasEl.value.removeEventListener('wheel', handleWheel);
		}
	});
});

onBeforeUnmount(() => {
	if (connection.value) {
		connection.value.dispose();
	}

	// カーソルタイマーをクリア
	cursorTimers.forEach((timer) => {
		clearTimeout(timer);
	});
	cursorTimers.clear();

	// 全画面モード用のイベントリスナーを削除
	document.removeEventListener('fullscreenchange', handleFullscreenChange);

	// ResizeObserver のクリーンアップ
	if (resizeObserver) {
		resizeObserver.disconnect();
		resizeObserver = null;
	}
});

// WebSocket接続（統合：お絵かき＋チャット）
function connectToChatRoomChannel() {
	const stream = useStream();

	// ユーザー間チャットかルームチャットかで使用するチャンネルを切り替え
	if (props.userId) {
		// 1対1チャットの場合はchatUserチャンネルを使用
		connection.value = stream.useChannel('chatUser', {
			otherId: props.userId,
		});
	} else {
		// ルームチャットの場合はchatRoomチャンネルを使用
		connection.value = stream.useChannel('chatRoom', {
			roomId: drawingId.value,
		});
	}

	// お絵かき関連イベント
	connection.value.on('drawingStroke', (data: any) => {
		recordCommLog('receive', 'drawingStroke', data);
		drawRemoteStroke(data);
	});

	connection.value.on('drawingProgress', (data: any) => {
		recordCommLog('receive', 'drawingProgress', data);
		drawRemoteProgress(data);
	});

	connection.value.on('cursorMove', (data: any) => {
		recordCommLog('receive', 'cursorMove', data);
		updateOtherCursor(data);
	});

	connection.value.on('clearCanvas', () => {
		recordCommLog('receive', 'clearCanvas', {});
		clearCanvasLocal();
	});

	connection.value.on('undoStroke', (data: any) => {
		recordCommLog('receive', 'undoStroke', data);
		handleRemoteUndo(data);
	});

	connection.value.on('redoStroke', (data: any) => {
		recordCommLog('receive', 'redoStroke', data);
		handleRemoteRedo(data);
	});

	// チャットオーバーレイ用
	connection.value.on('message', (message: any) => {
		showChatOverlay(message);
	});
}

// ツール設定
function setTool(tool: 'pen' | 'eraser' | 'eyedropper') {
	// ツール切り替え時に現在の描画を強制終了
	if (isDrawing.value) {
		stopDrawing();
	}

	// 現在のツールの線の太さを保存
	if (currentTool.value === 'pen' || currentTool.value === 'eraser') {
		toolStrokeWidths.value[currentTool.value] = strokeWidth.value;
	}

	// 新しいツールに切り替え
	currentTool.value = tool;

	// 新しいツールの線の太さを復元
	if (tool === 'pen' || tool === 'eraser') {
		strokeWidth.value = toolStrokeWidths.value[tool];
	}

	// 設定を自動保存
	saveUserSettings();
}

function setColor(color: string, index?: number) {
	currentColor.value = color;
	// インデックスが指定されている場合は保存
	if (index !== undefined) {
		currentColorIndex.value = index;
	}
	if (currentTool.value === 'eraser') {
		currentTool.value = 'pen';
	}

	// 設定を自動保存
	saveUserSettings();
}

// カラーピッカーを開く
function openColorPicker() {
	// Promiseを使ってokイベントを受け取る
	return new Promise<string | null>((resolve) => {
		const { dispose } = os.popup(
			defineAsyncComponent(() => import('@/components/MkColorPickerDialog.vue')),
			{
				currentColor: currentColor.value,
			},
			{
				ok: (color: string) => {
					resolve(color);
					dispose();
				},
				closed: () => {
					resolve(null);
					dispose();
				},
			},
		);
	}).then((colorValue) => {
		if (colorValue) {
			// 現在選択中のカラーパレットの色を更新
			colors.value[currentColorIndex.value] = colorValue;
			// 選択した色を現在の色として設定
			setColor(colorValue, currentColorIndex.value);
		}
	});
}

function setOpacity(opacity: number) {
	currentOpacity.value = opacity;

	// 設定を自動保存
	saveUserSettings();
}

function setStrokeWidth(width: number) {
	strokeWidth.value = width;

	// 現在のツールの線の太さを記憶
	if (currentTool.value === 'pen' || currentTool.value === 'eraser') {
		toolStrokeWidths.value[currentTool.value] = width;
	}

	// 設定を自動保存
	saveUserSettings();
}

// 描画開始
function startDrawing(event: MouseEvent | TouchEvent) {
	if (!ctx) return;

	// スペースキーが押されている場合はパンモード
	if (isSpaceKeyPressed.value && event instanceof MouseEvent) {
		isPanningWithSpace.value = true;
		panStart.value = { x: event.clientX, y: event.clientY };
		if (canvasEl.value) {
			canvasEl.value.style.cursor = 'grabbing';
		}
		return;
	}

	isDrawing.value = true;

	// マウス補正状態をリセット
	lastTime = 0;
	velocityHistory.length = 0;
	pointBuffer.length = 0;

	const point = getEventPoint(event);
	const pressure = calculatePressure(); // 初期筆圧を計算
	const pressurePoint: PressurePoint = { x: point.x, y: point.y, pressure };
	currentPath = [pressurePoint];

	// 軌跡ログを記録
	let clientX: number, clientY: number;
	if (event instanceof MouseEvent) {
		clientX = event.clientX;
		clientY = event.clientY;
		recordTraceLog('mousedown', clientX, clientY, point.x, point.y);
	} else if (event.touches.length > 0) {
		clientX = event.touches[0].clientX;
		clientY = event.touches[0].clientY;
		recordTraceLog('touchstart', clientX, clientY, point.x, point.y);
	}

	if (currentTool.value === 'eyedropper') {
		eyedropColor(point);
		return;
	}

	// 描画開始点を設定
	ctx.beginPath();
	ctx.moveTo(point.x, point.y);
}

// 描画中
function draw(event: MouseEvent | TouchEvent) {
	if (!ctx) return;

	// スペースキーでのパン中
	if (isPanningWithSpace.value && event instanceof MouseEvent) {
		const deltaX = event.clientX - panStart.value.x;
		const deltaY = event.clientY - panStart.value.y;

		panOffset.value = {
			x: panOffset.value.x + deltaX,
			y: panOffset.value.y + deltaY,
		};

		panStart.value = { x: event.clientX, y: event.clientY };
		return;
	}

	const point = getEventPoint(event);

	// 軌跡ログを記録
	let clientX: number, clientY: number;
	if (event instanceof MouseEvent) {
		clientX = event.clientX;
		clientY = event.clientY;
		if (isDrawing.value) {
			recordTraceLog('mousemove', clientX, clientY, point.x, point.y);
		}
	} else if (event.touches.length > 0) {
		clientX = event.touches[0].clientX;
		clientY = event.touches[0].clientY;
		if (isDrawing.value) {
			recordTraceLog('touchmove', clientX, clientY, point.x, point.y);
		}
	}

	// カーソル位置を他のユーザーに送信
	sendCursorPosition(point);

	if (!isDrawing.value || currentTool.value === 'eyedropper') return;

	const pressure = calculatePressure(); // 現在の筆圧を計算
	const pressurePoint: PressurePoint = { x: point.x, y: point.y, pressure };
	currentPath.push(pressurePoint);

	// ローカル描画
	drawLine(point);

	// リアルタイム描画進行状況を他のユーザーに送信
	sendDrawingProgress();
}

// 描画終了
function stopDrawing() {
	// スペースキーでのパン終了
	if (isPanningWithSpace.value) {
		isPanningWithSpace.value = false;
		if (canvasEl.value && isSpaceKeyPressed.value) {
			canvasEl.value.style.cursor = 'grab';
		} else if (canvasEl.value) {
			canvasEl.value.style.cursor = 'crosshair';
		}
		return;
	}

	if (!isDrawing.value || currentPath.length === 0) return;

	isDrawing.value = false;

	// リアルタイム描画で既に描画済みなので、ここでの再描画は不要
	// 再描画すると線が重なって太くなってしまう

	// ストローク履歴に追加
	const strokeData = {
		points: [...currentPath],
		tool: currentTool.value,
		color: currentColor.value,
		strokeWidth: strokeWidth.value,
		opacity: currentOpacity.value,
		timestamp: Date.now(),
	};

	addStrokeToHistory(strokeData);

	// 描画データを他のユーザーに送信
	sendDrawingStroke();
	currentPath = [];
}

// 手ブレ補正関数
function applyHandShakeCorrectionLocal(rawPoint: { x: number; y: number }): { x: number; y: number } {
	if (!handShakeCorrection.enabled.value) return rawPoint;

	const currentTime = Date.now();

	// 初回の場合は補正なしで返す
	if (lastTime === 0) {
		smoothedPoint = rawPoint;
		lastPoint = rawPoint;
		lastTime = currentTime;
		return rawPoint;
	}

	// 距離と時間差を計算
	const distance = Math.sqrt(
		Math.pow(rawPoint.x - lastPoint.x, 2) +
		Math.pow(rawPoint.y - lastPoint.y, 2),
	);
	const timeDelta = currentTime - lastTime;

	// 現在の補正レベル設定を取得
	const settings = getCurrentCorrectionSettings();

	// 手ぶれ補正: 最小移動距離未満の場合は前の点を返す（レベルに応じて閾値変更）
	if (handShakeCorrection.stabilization.value && distance < settings.minDistance) {
		return smoothedPoint;
	}

	// 速度計算（レベルに応じてスムージング係数変更）
	if (timeDelta > 0) {
		const currentVelocity = distance / timeDelta;
		velocity = velocity * settings.velocitySmoothing + currentVelocity * (1 - settings.velocitySmoothing);

		// 速度履歴を更新（最新5つを保持）
		velocityHistory.push(velocity);
		if (velocityHistory.length > 5) {
			velocityHistory.shift();
		}
	}

	// スムージング適用（レベルに応じて補正強度変更）
	smoothedPoint = {
		x: smoothedPoint.x * settings.factor + rawPoint.x * (1 - settings.factor),
		y: smoothedPoint.y * settings.factor + rawPoint.y * (1 - settings.factor),
	};

	// バッファに追加（予測描画用）
	pointBuffer.push({ x: smoothedPoint.x, y: smoothedPoint.y, time: currentTime });
	if (pointBuffer.length > 10) {
		pointBuffer.shift();
	}

	lastPoint = rawPoint;
	lastTime = currentTime;

	return smoothedPoint;
}

// 筆圧シミュレーション（速度ベース）
function calculatePressure(): number {
	if (!handShakeCorrection.pressureSimulation.value) return 1.0;

	// 速度履歴が少ない場合（描画開始直後）は標準の太さ
	if (velocityHistory.length < 2) return 1.0;

	// 速度に基づいて筆圧を計算
	const avgVelocity = velocityHistory.reduce((a, b) => a + b, 0) / velocityHistory.length;

	// 速度が高いほど筆圧が低く（線が細く）、遅いほど筆圧が高く（線が太く）
	// 速度の正規化: 0.5以下は遅い（太い）、1.5以上は速い（細い）
	const normalizedVelocity = Math.min(avgVelocity / 1.0, 2.0); // 0〜2.0に正規化

	// より大きな変化幅を持たせる: 0.3〜1.2の範囲
	// 遅い速度（0）→ 1.2（太い）、速い速度（2.0）→ 0.3（細い）
	const pressure = Math.max(0.3, Math.min(1.2, 1.2 - normalizedVelocity * 0.45));

	return pressure;
}

// 高精度な座標計算のためのヘルパー関数（モバイル対応）
function getAccurateCoordinates(canvas: HTMLCanvasElement, clientX: number, clientY: number): { x: number; y: number } {
	// キャッシュされたrectを使用、なければリアルタイムで取得
	const rect = canvasRect.value || canvas.getBoundingClientRect();

	// CSS座標からキャンバス座標への変換
	const cssX = clientX - rect.left;
	const cssY = clientY - rect.top;

	// CSS座標をキャンバス座標にスケール
	const scaleX = canvasWidth.value / rect.width;
	const scaleY = canvasHeight.value / rect.height;

	let canvasX = cssX * scaleX;
	let canvasY = cssY * scaleY;

	// モバイルでは座標を整数に丸める（サブピクセル問題回避）
	if (isTouchDevice.value) {
		canvasX = Math.round(canvasX);
		canvasY = Math.round(canvasY);
	} else {
		// デスクトップでは高精度座標
		canvasX = Math.round(canvasX * 10) / 10;
		canvasY = Math.round(canvasY * 10) / 10;
	}

	// キャンバス境界内に制限
	const clampedX = Math.max(0, Math.min(canvasWidth.value, canvasX));
	const clampedY = Math.max(0, Math.min(canvasHeight.value, canvasY));

	return {
		x: clampedX,
		y: clampedY,
	};
}

// イベントから座標を取得
function getEventPoint(event: MouseEvent | TouchEvent): { x: number; y: number } {
	// 現在のアクティブレイヤーのcanvas要素を取得
	const canvas = layerCanvases.value[currentLayer.value];

	let clientX: number, clientY: number;
	if (event instanceof MouseEvent) {
		clientX = event.clientX;
		clientY = event.clientY;
	} else {
		if (event.touches.length === 0) return { x: 0, y: 0 };
		clientX = event.touches[0].clientX;
		clientY = event.touches[0].clientY;
	}

	// パン/ズーム変換を考慮した座標計算を使用
	let coordinates = screenToCanvasCoordinates(
		clientX,
		clientY,
		canvas || null,
		canvasWidth.value,
		canvasHeight.value,
		displayWidth.value,
		displayHeight.value,
		panOffset.value,
		zoomLevel.value,
		zoomCenter.value,
		isTouchDevice.value,
	);

	// キャンバス範囲内にクランプ
	coordinates.x = Math.max(0, Math.min(canvasWidth.value, coordinates.x));
	coordinates.y = Math.max(0, Math.min(canvasHeight.value, coordinates.y));

	// 手ブレ補正を適用
	return applyHandShakeCorrectionLocal(coordinates);
}

// 軌跡ログを記録
function recordTraceLog(
	type: 'touchstart' | 'touchmove' | 'touchend' | 'mousedown' | 'mousemove' | 'mouseup',
	screenX: number,
	screenY: number,
	canvasX: number,
	canvasY: number,
) {
	// ログが大きくなりすぎないよう、最大1000件に制限
	if (drawingTraceLog.value.length >= 1000) {
		drawingTraceLog.value.shift();
	}

	drawingTraceLog.value.push({
		timestamp: Date.now(),
		type,
		screenX,
		screenY,
		canvasX,
		canvasY,
		tool: currentTool.value,
		color: currentColor.value,
		strokeWidth: strokeWidth.value,
		zoomLevel: zoomLevel.value,
		panOffset: { ...panOffset.value },
	});
}

// ダグラス・ピューカー法による線の簡素化
function simplifyPath(points: Array<{ x: number; y: number }>, tolerance = 1.0): Array<{ x: number; y: number }> {
	if (points.length <= 2) return points;

	// 再帰的にライン簡素化
	function douglasPeucker(pts: Array<{ x: number; y: number }>, epsilon: number): Array<{ x: number; y: number }> {
		if (pts.length <= 2) return pts;

		// 最初と最後の点間の直線からの最大距離を見つける
		let maxDist = 0;
		let index = 0;
		const start = pts[0];
		const end = pts[pts.length - 1];

		for (let i = 1; i < pts.length - 1; i++) {
			const dist = pointToLineDistance(pts[i], start, end);
			if (dist > maxDist) {
				index = i;
				maxDist = dist;
			}
		}

		// 最大距離が閾値より大きい場合、分割して再帰処理
		if (maxDist > epsilon) {
			const left = douglasPeucker(pts.slice(0, index + 1), epsilon);
			const right = douglasPeucker(pts.slice(index), epsilon);
			return left.slice(0, -1).concat(right);
		} else {
			return [start, end];
		}
	}

	// 点から直線への距離計算
	function pointToLineDistance(point: { x: number; y: number }, lineStart: { x: number; y: number }, lineEnd: { x: number; y: number }): number {
		const A = point.x - lineStart.x;
		const B = point.y - lineStart.y;
		const C = lineEnd.x - lineStart.x;
		const D = lineEnd.y - lineStart.y;
		const dot = A * C + B * D;
		const lenSq = C * C + D * D;

		if (lenSq === 0) return Math.sqrt(A * A + B * B);

		const param = dot / lenSq;
		let xx: number, yy: number;

		if (param < 0) {
			xx = lineStart.x;
			yy = lineStart.y;
		} else if (param > 1) {
			xx = lineEnd.x;
			yy = lineEnd.y;
		} else {
			xx = lineStart.x + param * C;
			yy = lineStart.y + param * D;
		}

		const dx = point.x - xx;
		const dy = point.y - yy;
		return Math.sqrt(dx * dx + dy * dy);
	}

	return douglasPeucker(points, tolerance);
}

// 移動平均による座標スムージング
function smoothPoints(points: Array<{ x: number; y: number }>, windowSize = 3): Array<{ x: number; y: number }> {
	if (points.length <= windowSize) return points;

	const smoothed: Array<{ x: number; y: number }> = [];
	const halfWindow = Math.floor(windowSize / 2);

	for (let i = 0; i < points.length; i++) {
		let sumX = 0, sumY = 0, count = 0;

		for (let j = Math.max(0, i - halfWindow); j <= Math.min(points.length - 1, i + halfWindow); j++) {
			sumX += points[j].x;
			sumY += points[j].y;
			count++;
		}

		smoothed.push({
			x: sumX / count,
			y: sumY / count,
		});
	}

	return smoothed;
}

// 最高品質スムーズパス描画（複数アルゴリズム組み合わせ + 筆圧対応）
function drawSmoothPathLocal(points: Array<{ x: number; y: number; pressure?: number }>, strokeWidth?: number, color?: string, opacity?: number, isEraser = false) {
	if (!ctx || points.length < 2) return;

	ctx.save();

	// パラメータが指定された場合は描画設定を更新
	const baseStrokeWidth = strokeWidth !== undefined ? strokeWidth : ctx.lineWidth;
	if (color !== undefined) {
		ctx.strokeStyle = color;
	}
	if (opacity !== undefined) {
		ctx.globalAlpha = opacity;
	}

	ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';
	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = 'high';

	// 筆圧情報があるかチェック
	const hasPressure = points.some(p => p.pressure !== undefined);

	if (hasPressure) {
		// 筆圧対応：各セグメントごとに描画
		for (let i = 0; i < points.length - 1; i++) {
			const p1 = points[i];
			const p2 = points[i + 1];
			const pressure = p2.pressure || 1.0;

			ctx.lineWidth = baseStrokeWidth * pressure;
			ctx.beginPath();
			ctx.moveTo(p1.x, p1.y);
			ctx.lineTo(p2.x, p2.y);
			ctx.stroke();
		}
	} else {
		// 筆圧なし：従来の描画
		ctx.lineWidth = baseStrokeWidth;

		// 1. 移動平均によるスムージング
		let processedPoints = smoothPoints(points, 3);

		// 2. ダグラス・ピューカー法による最適化（点が多い場合のみ）
		if (processedPoints.length > 4) {
			processedPoints = simplifyPath(processedPoints, 0.5);
		}

		// 3. 高品質ベジェ曲線描画
		ctx.beginPath();
		ctx.moveTo(processedPoints[0].x, processedPoints[0].y);

		if (processedPoints.length === 2) {
			ctx.lineTo(processedPoints[1].x, processedPoints[1].y);
		} else if (processedPoints.length === 3) {
			// 3点の場合は2次ベジェ曲線
			const cp = {
				x: (processedPoints[0].x + processedPoints[2].x) / 2,
				y: (processedPoints[0].y + processedPoints[2].y) / 2,
			};
			ctx.quadraticCurveTo(processedPoints[1].x, processedPoints[1].y, cp.x, cp.y);
			ctx.lineTo(processedPoints[2].x, processedPoints[2].y);
		} else {
			// 4点以上の場合は改良されたキャットマル・ロム・スプライン
			for (let i = 0; i < processedPoints.length - 1; i++) {
				const p0 = processedPoints[Math.max(0, i - 1)];
				const p1 = processedPoints[i];
				const p2 = processedPoints[i + 1];
				const p3 = processedPoints[Math.min(processedPoints.length - 1, i + 2)];

				// より滑らかな制御点計算
				const tension = 0.25; // 張力パラメータ
				const cp1x = p1.x + (p2.x - p0.x) * tension;
				const cp1y = p1.y + (p2.y - p0.y) * tension;
				const cp2x = p2.x - (p3.x - p1.x) * tension;
				const cp2y = p2.y - (p3.y - p1.y) * tension;

				// 3次ベジェ曲線で描画
				ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
			}
		}

		ctx.stroke();
	}

	ctx.restore();
}

// ローカル描画（高品質版＋筆圧シミュレーション）
function drawLine(point: { x: number; y: number }) {
	if (!ctx) return;

	// 筆圧シミュレーション適用
	const pressure = calculatePressure();
	const dynamicStrokeWidth = strokeWidth.value * pressure;

	// リアルタイム描画：軽量な線描画
	ctx.save();
	ctx.globalCompositeOperation = currentTool.value === 'eraser' ? 'destination-out' : 'source-over';
	ctx.strokeStyle = currentColor.value;
	ctx.globalAlpha = currentOpacity.value;
	ctx.lineWidth = dynamicStrokeWidth;
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';
	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = 'high';

	if (currentPath.length === 1) {
		// 単一点の場合は小さな円を描画
		ctx.beginPath();
		ctx.arc(point.x, point.y, dynamicStrokeWidth / 2, 0, Math.PI * 2);
		ctx.fill();
	} else if (currentPath.length >= 2) {
		// 線描画
		const prevPoint = currentPath[currentPath.length - 2];
		ctx.beginPath();
		ctx.moveTo(prevPoint.x, prevPoint.y);
		ctx.lineTo(point.x, point.y);
		ctx.stroke();
	}

	ctx.restore();
}

// リモートストローク描画（滑らか描画対応）
function drawRemoteStroke(data: any) {
	const stroke = renderStrokeOnLayer(data, { skipIfSelf: true });
	if (!stroke) return;

	if (stroke.userId && otherActiveStrokes.value.has(stroke.userId)) {
		otherActiveStrokes.value.delete(stroke.userId);
	}
}

// リモート描画進行状況（描画中）
function drawRemoteProgress(data: any) {
	if (!ctx || data.userId === $i.id) return;

	// 進行中の描画を更新
	otherActiveStrokes.value.set(data.userId, {
		points: data.points,
		tool: data.tool,
		color: data.color,
		strokeWidth: data.strokeWidth,
		opacity: data.opacity,
		userId: data.userId,
	});

	// キャンバスを再描画（進行中の描画を含む）
	redrawWithActiveStrokes();
}

// 進行中の描画を含むキャンバス再描画
function redrawWithActiveStrokes() {
	if (!ctx) return;

	// 現在のキャンバス状態を保存
	const imageData = ctx.getImageData(0, 0, canvasWidth.value, canvasHeight.value);

	// 進行中の描画を一時的に描画
	for (const [, strokeData] of otherActiveStrokes.value) {
		ctx.save();

		// 筆圧対応の描画処理
		if (strokeData.points && strokeData.points.length > 0) {
			// 筆圧情報がある場合は drawSmoothPathLocal を使用
			const hasPressure = strokeData.points.some((p: any) => p.pressure !== undefined);

			if (hasPressure && strokeData.points.length > 1) {
				// 筆圧対応のスムーズパス描画
				drawSmoothPathLocal(
					strokeData.points,
					strokeData.strokeWidth,
					strokeData.color,
					strokeData.opacity * 0.8, // 進行中は少し薄く
					strokeData.tool === 'eraser',
				);
			} else {
				// 筆圧なしの場合は従来の描画方法
				ctx.globalCompositeOperation = strokeData.tool === 'eraser' ? 'destination-out' : 'source-over';
				ctx.strokeStyle = strokeData.color;
				ctx.globalAlpha = strokeData.opacity * 0.8; // 進行中は少し薄く
				ctx.lineWidth = strokeData.strokeWidth;
				ctx.lineCap = 'round';
				ctx.lineJoin = 'round';

				// アンチエイリアス設定
				ctx.imageSmoothingEnabled = true;
				ctx.imageSmoothingQuality = 'high';

				// 線を描画
				if (strokeData.points.length > 1) {
					ctx.beginPath();
					for (let i = 0; i < strokeData.points.length; i++) {
						const point = strokeData.points[i];
						if (i === 0) {
							ctx.moveTo(point.x, point.y);
						} else {
							ctx.lineTo(point.x, point.y);
						}
					}
					ctx.stroke();
				}
			}
		}

		ctx.restore();
	}

	// パフォーマンス最適化: 次フレームで元の状態に戻す
	requestAnimationFrame(() => {
		if (ctx && otherActiveStrokes.value.size > 0) {
			// 進行中の描画があれば再度更新
			ctx.putImageData(imageData, 0, 0);
			redrawWithActiveStrokes();
		}
	});
}

// 描画データ送信
function sendDrawingStroke() {
	if (currentPath.length === 0 || !connection.value) return;

	try {
		const data = {
			points: currentPath,
			tool: currentTool.value,
			color: currentColor.value,
			strokeWidth: strokeWidth.value,
			opacity: currentOpacity.value,
			layer: currentLayer.value, // レイヤー情報を追加
		};
		connection.value.send('drawingStroke', data);
		recordCommLog('send', 'drawingStroke', data);
	} catch (error) {
		console.warn('🎨 [WARN] Failed to send drawing stroke:', error);
	}
}

// リアルタイム描画進行状況送信
function sendDrawingProgress() {
	if (currentPath.length === 0 || !connection.value) return;

	const now = Date.now();
	if (now - lastProgressSent < progressSendInterval) return;
	lastProgressSent = now;

	try {
		const data = {
			points: currentPath.slice(), // 現在の描画パスをコピー
			tool: currentTool.value,
			color: currentColor.value,
			strokeWidth: strokeWidth.value,
			opacity: currentOpacity.value,
			isComplete: false,
			layer: currentLayer.value, // レイヤー情報を追加
		};
		connection.value.send('drawingProgress', data);
		recordCommLog('send', 'drawingProgress', data);
	} catch (error) {
		console.warn('🎨 [WARN] Failed to send drawing progress:', error);
	}
}

// カーソル位置送信
function sendCursorPosition(point: { x: number; y: number }) {
	if (!connection.value) return;

	try {
		const data = {
			x: point.x,
			y: point.y,
		};
		console.log('📍 [CURSOR SEND]', {
			canvasX: point.x,
			canvasY: point.y,
			canvasWidth: canvasWidth.value,
			canvasHeight: canvasHeight.value,
			displayWidth: displayWidth.value,
			displayHeight: displayHeight.value,
		});
		connection.value.send('cursorMove', data);
		recordCommLog('send', 'cursorMove', data);
	} catch (error) {
		console.warn('🎨 [WARN] Failed to send cursor position:', error);
	}
}

// カーソルタイマー管理
const cursorTimers = new Map<string, ReturnType<typeof setTimeout>>();

// ユーザーごとの色管理
const userCursorColors = new Map<string, string>();

// ユーザーのカーソル色を取得（ランダム生成＆キャッシュ）
function getUserCursorColorLocal(userId: string): string {
	if (!userCursorColors.has(userId)) {
		// ユーザーIDをベースにした一意で鮮やかな色を生成
		const hue = (userId.charCodeAt(0) + userId.charCodeAt(userId.length - 1)) % 360;
		const saturation = 70 + (userId.length % 30); // 70-100%
		const lightness = 45 + (userId.charCodeAt(1) % 20); // 45-65%
		const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
		userCursorColors.set(userId, color);
	}
	return userCursorColors.get(userId)!;
}

// 背景色に対する適切なコントラスト色を計算
function getContrastColorLocal(backgroundColor: string): string {
	// HSL色をRGBに変換して明度を判定
	const hslMatch = backgroundColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
	if (hslMatch) {
		const lightness = parseInt(hslMatch[3]);
		return lightness > 55 ? '#000000' : '#ffffff';
	}
	return '#ffffff'; // デフォルトは白
}

// 他のユーザーのカーソル更新
function updateOtherCursor(data: any) {
	if (data.userId === $i.id) {
		return;
	}

	// ユーザー固有の色を取得
	const userColor = getUserCursorColorLocal(data.userId);
	console.log('📍 [CURSOR RECEIVE]', {
		canvasX: data.x,
		canvasY: data.y,
		displayCalc: {
			normalizedX: data.x / canvasWidth.value,
			normalizedY: data.y / canvasHeight.value,
			displayX: (data.x / canvasWidth.value) * displayWidth.value,
			displayY: (data.y / canvasHeight.value) * displayHeight.value,
			finalX: (data.x / canvasWidth.value * displayWidth.value) + panOffset.value.x * zoomLevel.value,
			finalY: (data.y / canvasHeight.value * displayHeight.value) + panOffset.value.y * zoomLevel.value,
		},
		canvasWidth: canvasWidth.value,
		canvasHeight: canvasHeight.value,
		displayWidth: displayWidth.value,
		displayHeight: displayHeight.value,
		panOffset: panOffset.value,
		zoomLevel: zoomLevel.value,
		scale: displayWidth.value / canvasWidth.value,
	});

	const index = otherCursors.value.findIndex(c => c.userId === data.userId);
	if (index >= 0) {
		otherCursors.value[index] = {
			userId: data.userId,
			userName: data.userName,
			x: data.x,
			y: data.y,
			color: userColor,
		};
	} else {
		otherCursors.value.push({
			userId: data.userId,
			userName: data.userName,
			x: data.x,
			y: data.y,
			color: userColor,
		});
	}

	// 既存のタイマーをクリア
	const existingTimer = cursorTimers.get(data.userId);
	if (existingTimer) {
		clearTimeout(existingTimer);
	}

	// 新しいタイマーを設定
	const timer = setTimeout(() => {
		const idx = otherCursors.value.findIndex(c => c.userId === data.userId);
		if (idx >= 0) {
			otherCursors.value.splice(idx, 1);
		}
		cursorTimers.delete(data.userId);
	}, 5000);

	cursorTimers.set(data.userId, timer);
}

// スポイト機能
function eyedropColor(point: { x: number; y: number }) {
	if (!ctx) return;

	const imageData = ctx.getImageData(point.x, point.y, 1, 1);
	const [r, g, b] = imageData.data;
	const color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

	currentColor.value = color;
	currentTool.value = 'pen';
}

// キャンバス保存
async function saveCanvas() {
	try {
		const response = await fetch('/api/drawing/save', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${$i.token}`,
			},
			body: JSON.stringify({
				roomId: drawingId.value,
			}),
		});

		if (response.ok) {
			// 成功メッセージ表示
			// TODO: 成功通知を表示
		} else {
			console.error('🎨 [ERROR] Failed to save canvas');
		}
	} catch (error) {
		console.error('🎨 [ERROR] Save canvas error:', error);
	}
}

// キャンバスクリア（確認ダイアログ付き）
async function clearCanvas() {
	try {
		// 部屋名またはユーザー名を取得
		let targetName = '';
		if (props.roomId) {
			// ルームチャットの場合は部屋ID（簡易表示）
			targetName = props.roomId.substring(0, 8);
		} else if (props.userId) {
			// 1対1チャットの場合はユーザーID（簡易表示）
			targetName = props.userId.substring(0, 8);
		}

		// 確認ダイアログで部屋名/ユーザー名の入力を求める
		const inputMessage = props.roomId
			? `キャンバスをクリアします。部屋ID「${targetName}」を入力してください：`
			: `キャンバスをクリアします。チャット相手のID「${targetName}」を入力してください：`;

		const { canceled, result: inputValue } = await os.inputText({
			title: 'キャンバスクリア確認',
			text: inputMessage,
			placeholder: targetName,
		});

		if (canceled) return;

		// 入力値が正しいか確認
		if (inputValue !== targetName) {
			os.alert({
				type: 'error',
				title: 'エラー',
				text: '入力された値が正しくありません。',
			});
			return;
		}

		// 確認が取れた場合のみクリア実行
		clearCanvasLocal();

		if (connection.value) {
			connection.value.send('clearCanvas', null);
		}

		// 成功メッセージ
		os.toast('キャンバスをクリアしました');
	} catch (error) {
		console.error('Canvas clear error:', error);
		os.alert({
			type: 'error',
			title: 'エラー',
			text: 'キャンバスのクリアに失敗しました。',
		});
	}
}

function clearCanvasLocal() {
	for (let i = 0; i < MAX_LAYERS; i++) {
		const layerCtx = layerContexts.value[i];
		if (layerCtx) {
			layerCtx.clearRect(0, 0, canvasWidth.value, canvasHeight.value);
		}
	}
	layerStrokeHistory.value = Array.from({ length: MAX_LAYERS }, () => []);
	strokeHistory.value = [];
	undoStack.value = [];
	redoStack.value = [];
	otherActiveStrokes.value.clear();
	ctx = layerContexts.value[currentLayer.value] ?? ctx;
}

// ズームをリセット
function resetZoom() {
	zoomLevel.value = 1;
	panOffset.value = { x: 0, y: 0 };
	zoomCenter.value = { x: 0, y: 0 };

	// 設定を自動保存
	saveUserSettings();
}

// ズームイン（拡大）
function zoomIn() {
	const newZoom = Math.min(zoomLevel.value * 1.2, maxZoom);
	zoomLevel.value = newZoom;

	// 設定を自動保存
	saveUserSettings();
}

// ズームアウト（縮小）
function zoomOut() {
	const newZoom = Math.max(zoomLevel.value / 1.2, 0.1);
	zoomLevel.value = newZoom;

	// 設定を自動保存
	saveUserSettings();
}

// マウスホイールによるズーム
function handleWheel(event: WheelEvent) {
	// Ctrlキーが押されている場合のみズーム
	if (event.ctrlKey || event.metaKey) {
		event.preventDefault();

		const delta = -event.deltaY;
		const zoomFactor = delta > 0 ? 1.1 : 0.9;
		const newZoom = Math.max(minZoom, Math.min(maxZoom, zoomLevel.value * zoomFactor));

		zoomLevel.value = newZoom;

		// 設定を自動保存
		saveUserSettings();
	}
}

// キャンバスサイズ変更ダイアログを表示
async function showCanvasSizeDialog() {
	// Width入力
	const { canceled: widthCanceled, result: width } = await os.inputText({
		title: '幅 (Width) を入力',
		placeholder: '800',
		default: String(canvasWidth.value),
	});
	if (widthCanceled) return;

	// Height入力
	const { canceled: heightCanceled, result: height } = await os.inputText({
		title: '高さ (Height) を入力',
		placeholder: '600',
		default: String(canvasHeight.value),
	});
	if (heightCanceled) return;

	const w = parseInt(width);
	const h = parseInt(height);

	if (isNaN(w) || isNaN(h) || w < 100 || h < 100 || w > 4000 || h > 4000) {
		os.alert({
			type: 'error',
			text: 'サイズは100〜4000の範囲で指定してください',
		});
		return;
	}

	await changeCanvasSize(w, h);
}

// コンテナサイズに合わせてdisplayサイズを更新
function updateDisplaySize() {
	if (!canvasContainerEl.value) return;

	const container = canvasContainerEl.value;
	const containerRect = container.getBoundingClientRect();

	// パディングを考慮（CSS: padding: 16px）
	const padding = 32; // 16px × 2
	const containerWidth = containerRect.width - padding;
	const containerHeight = containerRect.height - padding;

	// キャンバスのアスペクト比
	const canvasAspect = canvasWidth.value / canvasHeight.value;
	const containerAspect = containerWidth / containerHeight;

	// コンテナに収まるようにdisplayサイズを計算
	if (containerAspect > canvasAspect) {
		// コンテナが横長 → 高さに合わせる
		displayHeight.value = containerHeight;
		displayWidth.value = containerHeight * canvasAspect;
	} else {
		// コンテナが縦長 → 幅に合わせる
		displayWidth.value = containerWidth;
		displayHeight.value = containerWidth / canvasAspect;
	}

	console.log('📐 [DISPLAY] Display size updated:', {
		container: `${containerWidth.toFixed(1)}×${containerHeight.toFixed(1)}`,
		canvas: `${canvasWidth.value}×${canvasHeight.value}`,
		display: `${displayWidth.value.toFixed(1)}×${displayHeight.value.toFixed(1)}`,
		aspect: { canvas: canvasAspect.toFixed(3), container: containerAspect.toFixed(3) },
	});
}

// キャンバスサイズを変更
async function changeCanvasSize(newWidth: number, newHeight: number) {
	// 全レイヤーの描画内容を保存
	const layerImageData: Array<ImageData | null> = [];
	for (let i = 0; i < MAX_LAYERS; i++) {
		const layerCtx = layerContexts.value[i];
		if (layerCtx) {
			layerImageData[i] = layerCtx.getImageData(0, 0, canvasWidth.value, canvasHeight.value);
		} else {
			layerImageData[i] = null;
		}
	}

	// 新しいサイズを設定
	canvasWidth.value = newWidth;
	canvasHeight.value = newHeight;

	// コンテナサイズに合わせてdisplayサイズを更新
	updateDisplaySize();

	console.log('🎨 [SIZE] Updated canvas size:', {
		canvasWidth: canvasWidth.value,
		canvasHeight: canvasHeight.value,
		displayWidth: displayWidth.value,
		displayHeight: displayHeight.value,
		physicalWidth: physicalCanvasWidth.value,
		physicalHeight: physicalCanvasHeight.value,
	});

	// DPRを考慮して全レイヤーのキャンバスを再初期化
	const dpr = window.devicePixelRatio || 1;

	// 次のフレームで実行（テンプレートのバインディングが適用された後）
	await nextTick();

	// 実際のcanvas要素のサイズを確認
	const firstCanvas = layerCanvases.value[0];
	if (firstCanvas) {
		console.log('🎨 [SIZE] Actual canvas element:', {
			cssWidth: firstCanvas.style.width,
			cssHeight: firstCanvas.style.height,
			attrWidth: firstCanvas.width,
			attrHeight: firstCanvas.height,
			clientWidth: firstCanvas.clientWidth,
			clientHeight: firstCanvas.clientHeight,
		});
	}

	for (let i = 0; i < MAX_LAYERS; i++) {
		const canvas = layerCanvases.value[i];
		if (!canvas) continue;

		// コンテキストを再取得
		const context = canvas.getContext('2d', {
			alpha: true,
			desynchronized: false,
			colorSpace: 'srgb',
			willReadFrequently: false,
		});

		if (context) {
			context.scale(dpr, dpr);
			context.lineCap = 'round';
			context.lineJoin = 'round';
			context.imageSmoothingEnabled = true;
			context.imageSmoothingQuality = 'high';
			context.globalCompositeOperation = 'source-over';
			context.miterLimit = 10;
			context.lineWidth = 2;
			context.filter = 'none';

			layerContexts.value[i] = context;

			// 以前の描画を復元
			if (layerImageData[i]) {
				context.putImageData(layerImageData[i]!, 0, 0);
			}
		}
	}

	// 現在のレイヤーのコンテキストを更新
	ctx = layerContexts.value[currentLayer.value];

	// ズームをリセット
	resetZoom();

	os.toast(`キャンバスサイズを ${newWidth}×${newHeight} に変更しました`);

	// ルーム設定を保存
	await saveRoomSettings();
}

// Undo（元に戻す）
function undo() {
	if (!canUndo.value || !ctx) return;

	// 現在の状態をredoスタックに保存
	const currentState = {
		history: [...strokeHistory.value],
		imageData: ctx.getImageData(0, 0, canvasWidth.value, canvasHeight.value),
	};
	redoStack.value.push(currentState);

	// undoスタックから前の状態を取得
	const previousState = undoStack.value.pop();
	if (!previousState) return;

	// strokeHistoryを復元
	strokeHistory.value = [...previousState.history];

	// キャンバスをクリアして再描画
	ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value);

	// 履歴から再描画
	redrawCanvasFromHistory();

	console.log('🎨 [UNDO] Undo performed', {
		undoStackSize: undoStack.value.length,
		redoStackSize: redoStack.value.length,
		strokeCount: strokeHistory.value.length,
	});

	// 他のユーザーにundoイベントを送信
	if (connection.value) {
		const data = {
			layer: currentLayer.value,
			userId: $i?.id,
			userName: $i?.username,
		};
		connection.value.send('undoStroke', data);
		recordCommLog('send', 'undoStroke', data);
	}
}

// Redo（やり直す）
function redo() {
	if (!canRedo.value || !ctx) return;

	// 現在の状態をundoスタックに保存
	const currentState = {
		history: [...strokeHistory.value],
		imageData: ctx.getImageData(0, 0, canvasWidth.value, canvasHeight.value),
	};
	undoStack.value.push(currentState);

	// redoスタックから次の状態を取得
	const nextState = redoStack.value.pop();
	if (!nextState) return;

	// strokeHistoryを復元
	strokeHistory.value = [...nextState.history];

	// キャンバスをクリアして再描画
	ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value);

	// 履歴から再描画
	redrawCanvasFromHistory();

	console.log('🎨 [REDO] Redo performed', {
		undoStackSize: undoStack.value.length,
		redoStackSize: redoStack.value.length,
		strokeCount: strokeHistory.value.length,
	});

	// 他のユーザーにredoイベントを送信
	if (connection.value) {
		const data = {
			layer: currentLayer.value,
			userId: $i?.id,
			userName: $i?.username,
		};
		connection.value.send('redoStroke', data);
		recordCommLog('send', 'redoStroke', data);
	}
}

// リモートユーザーのUndoイベントを処理
function handleRemoteUndo(data: any) {
	if (!ctx || data.userId === $i.id) return;

	// 指定レイヤーの最後のストロークを削除
	const targetLayer = data.layer;
	if (targetLayer < 0 || targetLayer >= MAX_LAYERS) return;

	// レイヤーストローク履歴から最後の1つを削除
	if (layerStrokeHistory.value[targetLayer].length > 0) {
		layerStrokeHistory.value[targetLayer].pop();
	}

	// 現在のレイヤーが対象レイヤーの場合、再描画
	if (currentLayer.value === targetLayer) {
		strokeHistory.value = [...layerStrokeHistory.value[targetLayer]];
		redrawCanvasFromHistory();
	}
}

// リモートユーザーのRedoイベントを処理
function handleRemoteRedo(data: any) {
	if (!ctx || data.userId === $i.id) return;

	// 注意: Redoは単純な実装では履歴がないため実装困難
	// より高度な実装では、undo/redoスタックをサーバーで管理する必要がある
	// 現時点では、リモートredoは未対応として警告のみ出力
	console.warn('🎨 [REMOTE-REDO] Remote redo is not fully supported yet. Requires server-side undo/redo stack management.');
}

// レイヤー切り替え
function switchLayer(layerIndex: number) {
	if (layerIndex < 0 || layerIndex >= MAX_LAYERS) return;

	// 新しいレイヤーに切り替え
	currentLayer.value = layerIndex;
	ctx = layerContexts.value[layerIndex];
	// canvasElも更新（イベントリスナーやカーソルスタイル変更用）
	canvasEl.value = layerCanvases.value[layerIndex];

	// 設定を自動保存
	saveUserSettings();
}

// レイヤーメニューを表示
async function showLayerMenu() {
	const { canceled, result } = await os.select({
		title: 'レイヤー操作',
		items: [
			{ label: 'レイヤーを結合', value: 'merge' },
			{ label: 'レイヤーを移動', value: 'move' },
			{ label: 'レイヤーをクリア', value: 'clear' },
		],
	});

	if (canceled || !result) return;

	switch (result) {
		case 'merge':
			await mergeLayersDialog();
			break;
		case 'move':
			await moveLayerDialog();
			break;
		case 'clear':
			await clearLayerDialog();
			break;
	}
}

// レイヤー結合ダイアログ
async function mergeLayersDialog() {
	const { canceled, result } = await os.select({
		title: 'レイヤー結合',
		items: [
			{ label: 'レイヤー1とレイヤー2を結合', value: 0 },
			{ label: 'レイヤー2とレイヤー3を結合', value: 1 },
		],
	});

	if (canceled || result === undefined || result === null) return;

	const layerIndex = typeof result === 'number' ? result : 0;
	await mergeLayers(layerIndex, layerIndex + 1);
}

// レイヤー結合を実行
async function mergeLayers(fromLayer: number, toLayer: number) {
	if (fromLayer < 0 || fromLayer >= MAX_LAYERS || toLayer < 0 || toLayer >= MAX_LAYERS) return;
	if (fromLayer === toLayer) return;

	// fromLayerの内容をtoLayerに結合
	layerStrokeHistory.value[toLayer] = [
		...layerStrokeHistory.value[toLayer],
		...layerStrokeHistory.value[fromLayer],
	];

	// fromLayerをクリア
	layerStrokeHistory.value[fromLayer] = [];

	// 現在のレイヤーを再描画
	if (currentLayer.value === fromLayer || currentLayer.value === toLayer) {
		strokeHistory.value = layerStrokeHistory.value[currentLayer.value];
		if (ctx) {
			ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value);
			redrawCanvasFromHistory();
		}
	}

	os.toast(`レイヤー${fromLayer + 1}とレイヤー${toLayer + 1}を結合しました`);
}

// レイヤー移動ダイアログ
async function moveLayerDialog() {
	const { canceled, result } = await os.select({
		title: 'レイヤー移動',
		items: [
			{ label: 'レイヤー1の内容をレイヤー2に移動', value: '0-1' },
			{ label: 'レイヤー1の内容をレイヤー3に移動', value: '0-2' },
			{ label: 'レイヤー2の内容をレイヤー1に移動', value: '1-0' },
			{ label: 'レイヤー2の内容をレイヤー3に移動', value: '1-2' },
			{ label: 'レイヤー3の内容をレイヤー1に移動', value: '2-0' },
			{ label: 'レイヤー3の内容をレイヤー2に移動', value: '2-1' },
		],
	});

	if (canceled || !result) return;

	const [from, to] = (typeof result === 'string' ? result : '0-1').split('-').map(Number);
	await moveLayer(from, to);
}

// レイヤー移動を実行
async function moveLayer(fromLayer: number, toLayer: number) {
	if (fromLayer < 0 || fromLayer >= MAX_LAYERS || toLayer < 0 || toLayer >= MAX_LAYERS) return;
	if (fromLayer === toLayer) return;

	// fromLayerの内容をtoLayerに移動
	layerStrokeHistory.value[toLayer] = [...layerStrokeHistory.value[fromLayer]];
	layerStrokeHistory.value[fromLayer] = [];

	// 現在のレイヤーを再描画
	if (currentLayer.value === fromLayer || currentLayer.value === toLayer) {
		strokeHistory.value = layerStrokeHistory.value[currentLayer.value];
		if (ctx) {
			ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value);
			redrawCanvasFromHistory();
		}
	}

	os.toast(`レイヤー${fromLayer + 1}の内容をレイヤー${toLayer + 1}に移動しました`);
}

// レイヤークリアダイアログ
async function clearLayerDialog() {
	const { canceled, result } = await os.select({
		title: 'レイヤークリア',
		items: [
			{ label: 'レイヤー1をクリア', value: 0 },
			{ label: 'レイヤー2をクリア', value: 1 },
			{ label: 'レイヤー3をクリア', value: 2 },
		],
	});

	if (canceled || result === undefined || result === null) return;

	const layerIndex = typeof result === 'number' ? result : 0;

	const { canceled: confirmCanceled } = await os.confirm({
		type: 'warning',
		text: `レイヤー${layerIndex + 1}の内容をすべて削除しますか？`,
	});

	if (confirmCanceled) return;

	clearLayer(layerIndex);
}

// レイヤーをクリア
function clearLayer(layerIndex: number) {
	if (layerIndex < 0 || layerIndex >= MAX_LAYERS) return;

	layerStrokeHistory.value[layerIndex] = [];

	if (currentLayer.value === layerIndex) {
		strokeHistory.value = [];
		if (ctx) {
			ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value);
		}
	}

	os.toast(`レイヤー${layerIndex + 1}をクリアしました`);
}

// デバッグログを出力（軌跡記録付き）
async function exportDebugLog() {
	const debugData = {
		timestamp: new Date().toISOString(),
		canvasInfo: {
			canvasWidth: canvasWidth.value,
			canvasHeight: canvasHeight.value,
			displayWidth: displayWidth.value,
			displayHeight: displayHeight.value,
			devicePixelRatio: window.devicePixelRatio,
		},
		currentState: {
			tool: currentTool.value,
			color: currentColor.value,
			strokeWidth: strokeWidth.value,
			opacity: currentOpacity.value,
			zoomLevel: zoomLevel.value,
			panOffset: panOffset.value,
		},
		traceLog: drawingTraceLog.value,
		strokeHistory: strokeHistory.value.map(stroke => ({
			tool: stroke.tool,
			color: stroke.color,
			strokeWidth: stroke.strokeWidth,
			pointCount: stroke.points.length,
		})),
		debugInfo: debugInfo.value,
		performance: monitorPerformance(),
	};

	// JSON形式でダウンロード
	const json = JSON.stringify(debugData, null, 2);
	const blob = new Blob([json], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `drawing-debug-${Date.now()}.json`;
	a.click();
	URL.revokeObjectURL(url);

	os.toast('デバッグログを出力しました');
}

// 通信ログを記録
function recordCommLog(direction: 'send' | 'receive', type: string, data: any) {
	communicationLog.value.push({
		timestamp: Date.now(),
		direction,
		type,
		data,
	});

	// 最大エントリ数を超えたら古いログを削除
	if (communicationLog.value.length > MAX_COMM_LOG_ENTRIES) {
		communicationLog.value.shift();
	}
}

// 通信ログをクリア
function clearCommLog() {
	communicationLog.value = [];
	os.toast('通信ログをクリアしました');
}

// 通信ログを出力
async function exportCommLog() {
	const commLogData = {
		timestamp: new Date().toISOString(),
		logCount: communicationLog.value.length,
		logs: communicationLog.value.map(log => ({
			timestamp: new Date(log.timestamp).toISOString(),
			direction: log.direction,
			type: log.type,
			data: log.data,
		})),
	};

	// JSON形式でダウンロード
	const json = JSON.stringify(commLogData, null, 2);
	const blob = new Blob([json], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `comm-log-${Date.now()}.json`;
	a.click();
	URL.revokeObjectURL(url);

	os.toast('通信ログを出力しました');
}

// タイムスタンプをフォーマット
function formatTime(timestamp: number): string {
	const date = new Date(timestamp);
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');
	const seconds = String(date.getSeconds()).padStart(2, '0');
	const ms = String(date.getMilliseconds()).padStart(3, '0');
	return `${hours}:${minutes}:${seconds}.${ms}`;
}

// ログデータをフォーマット
function formatLogData(data: any): string {
	if (typeof data === 'object') {
		// オブジェクトの場合は主要な情報だけ抽出
		if (data.points && Array.isArray(data.points)) {
			return `points: ${data.points.length}個, tool: ${data.tool}, color: ${data.color}`;
		} else if (data.x !== undefined && data.y !== undefined) {
			return `x: ${data.x.toFixed(1)}, y: ${data.y.toFixed(1)}`;
		} else {
			return JSON.stringify(data, null, 2);
		}
	}
	return String(data);
}

// ラッパー関数: インポートした座標変換関数を使用
function screenToCanvas(clientX: number, clientY: number): Point {
	// 現在のアクティブレイヤーのcanvas要素を取得
	const canvas = layerCanvases.value[currentLayer.value];
	return screenToCanvasCoordinates(
		clientX,
		clientY,
		canvas || null,
		canvasWidth.value,
		canvasHeight.value,
		displayWidth.value,
		displayHeight.value,
		panOffset.value,
		zoomLevel.value,
		zoomCenter.value,
		isTouchDevice.value,
		debugInfo,
	);
}

// ラッパー関数: インポートした描画領域計算関数を使用
function getDrawingArea() {
	// 現在のアクティブレイヤーのcanvas要素を取得
	const canvas = layerCanvases.value[currentLayer.value];
	return getActualDrawingArea(
		canvas || null,
		canvasWidth.value,
		canvasHeight.value,
	);
}

// キャンバス座標をスクリーン座標に変換（スマホ向け高精度変換）
function canvasToScreenCoordinates(canvasX: number, canvasY: number): { x: number; y: number } {
	if (!canvasRect.value) return { x: canvasX, y: canvasY };

	// CSS Transformを考慮した順変換
	// transform: translate(panX, panY) scale(zoom) の順変換

	// 1. Transform Origin (基準点) を取得
	const originX = isTouchDevice.value ? zoomCenter.value.x : displayWidth.value / 2;
	const originY = isTouchDevice.value ? zoomCenter.value.y : displayHeight.value / 2;

	// 2. Scale（拡大縮小）の適用（基準点中心）
	const fromOriginX = canvasX - originX;
	const fromOriginY = canvasY - originY;

	const scaledFromOriginX = fromOriginX * zoomLevel.value;
	const scaledFromOriginY = fromOriginY * zoomLevel.value;

	const afterScaleX = scaledFromOriginX + originX;
	const afterScaleY = scaledFromOriginY + originY;

	// 3. Translate（平行移動）の適用
	const afterTranslateX = afterScaleX + panOffset.value.x;
	const afterTranslateY = afterScaleY + panOffset.value.y;

	// 4. スクリーン座標に変換
	const screenX = afterTranslateX + canvasRect.value.left;
	const screenY = afterTranslateY + canvasRect.value.top;

	return { x: screenX, y: screenY };
}

// キャンバス座標を表示座標に変換（カーソル表示用）
function canvasToDisplayCoordinates(canvasX: number, canvasY: number): { x: number; y: number } {
	// キャンバス座標（0〜4000）を表示座標（CSS pixel、パン/ズーム適用済み）に変換
	// キャンバスのCSS変換: translate(-50%, -50%) translate(panX, panY) scale(zoom)
	// transformOrigin: center

	// 1. キャンバス座標を正規化（0〜1）
	const normalizedX = canvasX / canvasWidth.value;
	const normalizedY = canvasY / canvasHeight.value;

	// 2. 表示サイズにスケール（CSS上のキャンバスサイズ）
	const displayX = normalizedX * displayWidth.value;
	const displayY = normalizedY * displayHeight.value;

	// 3. キャンバス中心を基準にした座標に変換（transformOrigin: center）
	const centerX = displayWidth.value / 2;
	const centerY = displayHeight.value / 2;
	const fromCenterX = displayX - centerX;
	const fromCenterY = displayY - centerY;

	// 4. ズームを適用（中心基準）
	const scaledFromCenterX = fromCenterX * zoomLevel.value;
	const scaledFromCenterY = fromCenterY * zoomLevel.value;

	// 5. 中心を戻す
	const afterScaleX = scaledFromCenterX + centerX;
	const afterScaleY = scaledFromCenterY + centerY;

	// 6. パンオフセットを適用
	const finalX = afterScaleX + panOffset.value.x;
	const finalY = afterScaleY + panOffset.value.y;

	return { x: finalX, y: finalY };
}

// 2本指パン用のタッチハンドラー（最適化版）
function handleTouchStart(e: TouchEvent) {
	// タッチデバイスでのネイティブスクロールを防止
	if (isTouchDevice.value) {
		e.preventDefault();
	}

	if (e.touches.length === 1) {
		// 1本指の場合は通常の描画
		startDrawing(e);
	} else if (e.touches.length === 2) {
		// 2本指の場合: パン/ズーム開始
		isDrawing.value = false; // 描画モードを終了

		// 2本指ジェスチャー開始
		isPanning.value = true;
		isZooming.value = false;
		gestureState.value = 'none';

		const touch1 = e.touches[0];
		const touch2 = e.touches[1];
		const centerX = (touch1.clientX + touch2.clientX) / 2;
		const centerY = (touch1.clientY + touch2.clientY) / 2;

		// タップ判定用に開始位置を記録
		twoFingerTapStartPos.value = { x: centerX, y: centerY };

		panStart.value = { x: centerX, y: centerY };

		// ズーム中心点を論理座標系に変換
		if (canvasEl.value) {
			const canvasRect = canvasEl.value.getBoundingClientRect();

			// canvas要素内の相対座標
			const canvasRelativeX = centerX - canvasRect.left;
			const canvasRelativeY = centerY - canvasRect.top;

			// transform適用後のサイズ
			const transformedWidth = canvasRect.width;
			const transformedHeight = canvasRect.height;

			// 正規化座標（0-1）
			const normalizedX = canvasRelativeX / transformedWidth;
			const normalizedY = canvasRelativeY / transformedHeight;

			// 論理キャンバス座標に変換
			let logicalX = normalizedX * canvasWidth.value;
			let logicalY = normalizedY * canvasHeight.value;

			// 論理キャンバス範囲内に制限
			logicalX = Math.max(0, Math.min(canvasWidth.value, logicalX));
			logicalY = Math.max(0, Math.min(canvasHeight.value, logicalY));

			zoomCenter.value = { x: logicalX, y: logicalY };
		}

		// 初期距離を記録
		const dx = touch1.clientX - touch2.clientX;
		const dy = touch1.clientY - touch2.clientY;
		const distance = Math.sqrt(dx * dx + dy * dy);

		lastTouchDistance.value = distance;
		initialDistance.value = distance;
		distanceHistory.value = [distance];
	}
}

function handleTouchMove(e: TouchEvent) {
	// パフォーマンス向上のため、必要な場合のみpreventDefault
	if ((e.touches.length === 1 && !isPanning.value) || (e.touches.length === 2 && isPanning.value)) {
		e.preventDefault();
	}

	if (e.touches.length === 1 && !isPanning.value) {
		// 1本指の場合は通常の描画（パフォーマンス最適化）
		requestAnimationFrame(() => {
			draw(e);
		});
	} else if (e.touches.length === 2 && isPanning.value) {
		// 2本指ジェスチャー処理
		const touch1 = e.touches[0];
		const touch2 = e.touches[1];
		const centerX = (touch1.clientX + touch2.clientX) / 2;
		const centerY = (touch1.clientY + touch2.clientY) / 2;

		// 現在の2本指間の距離を計算
		const dx = touch1.clientX - touch2.clientX;
		const dy = touch1.clientY - touch2.clientY;
		const currentDistance = Math.sqrt(dx * dx + dy * dy);

		// 距離履歴を管理（スムージング用）
		distanceHistory.value.push(currentDistance);
		if (distanceHistory.value.length > 5) {
			distanceHistory.value.shift();
		}

		// 平均距離を計算してノイズを除去
		const avgDistance = distanceHistory.value.reduce((a, b) => a + b, 0) / distanceHistory.value.length;
		const distanceFromInitial = Math.abs(avgDistance - initialDistance.value);

		// パン量を計算
		const panDeltaX = centerX - panStart.value.x;
		const panDeltaY = centerY - panStart.value.y;
		const panDistance = Math.sqrt(panDeltaX * panDeltaX + panDeltaY * panDeltaY);

		// ジェスチャー判定
		if (gestureState.value === 'none') {
			// 初期状態：ズームかパンかを判定
			if (distanceFromInitial > zoomThreshold) {
				gestureState.value = 'zoom';
				isZooming.value = true;
				twoFingerTapStartPos.value = null; // タップ判定をキャンセル
			} else if (panDistance > panThreshold) {
				gestureState.value = 'pan';
				twoFingerTapStartPos.value = null; // タップ判定をキャンセル
			}
		}

		// ズーム処理
		if (gestureState.value === 'zoom' || gestureState.value === 'hybrid') {
			const zoomFactor = avgDistance / lastTouchDistance.value;
			const newZoom = Math.max(minZoom, Math.min(maxZoom, zoomLevel.value * zoomFactor));

			if (Math.abs(newZoom - zoomLevel.value) > 0.01) {
				// ズーム中心を維持するためのパンオフセット調整
				// ズーム中心（論理座標）をピクセル座標に変換
				const centerPixelX = (zoomCenter.value.x / canvasWidth.value) * displayWidth.value;
				const centerPixelY = (zoomCenter.value.y / canvasHeight.value) * displayHeight.value;

				// transformOriginが'center'なので、中心からの相対位置を計算
				const relativeCenterX = centerPixelX - displayWidth.value / 2;
				const relativeCenterY = centerPixelY - displayHeight.value / 2;

				// ズーム中心のスクリーン位置を維持するためのパンオフセット調整
				// oldScreenPos = relativeCenterX * oldZoom + oldPanX
				// newScreenPos = relativeCenterX * newZoom + newPanX
				// oldScreenPos = newScreenPos より:
				// newPanX = oldPanX + relativeCenterX * (oldZoom - newZoom)
				panOffset.value = {
					x: panOffset.value.x + relativeCenterX * (zoomLevel.value - newZoom),
					y: panOffset.value.y + relativeCenterY * (zoomLevel.value - newZoom),
				};

				zoomLevel.value = newZoom;
			}
		}

		// パン処理
		if (gestureState.value === 'pan' || gestureState.value === 'hybrid') {
			if (Math.abs(panDeltaX) > 1 || Math.abs(panDeltaY) > 1) {
				// panOffsetはピクセル単位なので、そのまま加算
				panOffset.value = {
					x: panOffset.value.x + panDeltaX,
					y: panOffset.value.y + panDeltaY,
				};
			}
		}

		// ハイブリッド状態の判定（パンとズームが同時に発生）
		if (gestureState.value === 'zoom' && panDistance > panThreshold * 2) {
			gestureState.value = 'hybrid';
			twoFingerTapStartPos.value = null; // タップ判定をキャンセル
		} else if (gestureState.value === 'pan' && distanceFromInitial > zoomThreshold * 0.5) {
			gestureState.value = 'hybrid';
			twoFingerTapStartPos.value = null; // タップ判定をキャンセル
		}

		// 基準点を更新
		panStart.value = { x: centerX, y: centerY };
		lastTouchDistance.value = avgDistance;
	}
}

function handleTouchEnd(e: TouchEvent) {
	// タッチエンド時のイベント最適化
	if (isTouchDevice.value) {
		e.preventDefault();
	}

	if (e.touches.length === 0) {
		// すべての指が離れた場合

		// 2本指タップ判定（パン/ズームが発生していない場合）
		if (isPanning.value && twoFingerTapStartPos.value && gestureState.value === 'none') {
			// 移動量を計算
			const touch1 = e.changedTouches[0];
			const touch2 = e.changedTouches[1];
			if (touch1 && touch2) {
				const endCenterX = (touch1.clientX + touch2.clientX) / 2;
				const endCenterY = (touch1.clientY + touch2.clientY) / 2;
				const moveDistance = Math.sqrt(
					Math.pow(endCenterX - twoFingerTapStartPos.value.x, 2) +
					Math.pow(endCenterY - twoFingerTapStartPos.value.y, 2),
				);

				if (moveDistance < tapMoveThreshold) {
					// タップとして認識
					const now = Date.now();
					const timeSinceLastTap = now - lastTwoFingerTap.value;

					if (timeSinceLastTap < twoFingerTapTimeout && lastTwoFingerTap.value > 0) {
						// ダブルタップ検出: アンドゥ実行
						performAdvancedUndo();
						lastTwoFingerTap.value = 0; // リセット
					} else {
						// 最初のタップ
						lastTwoFingerTap.value = now;
					}
				}
			}
		}

		twoFingerTapStartPos.value = null;
		const wasPanningOrZooming = isPanning.value || isZooming.value;
		isPanning.value = false;
		isZooming.value = false;
		gestureState.value = 'none';
		distanceHistory.value = [];
		stopDrawing();

		// パンまたはズームが行われていた場合、設定を自動保存
		if (wasPanningOrZooming) {
			saveUserSettings();
		}
	} else if (e.touches.length === 1 && isPanning.value) {
		// 2本指から1本指になった場合
		twoFingerTapStartPos.value = null;
		isPanning.value = false;
		isZooming.value = false;
		gestureState.value = 'none';
		distanceHistory.value = [];

		// パンまたはズームが行われていたため、設定を自動保存
		saveUserSettings();

		// 残った1本指で描画を開始
		startDrawing(e);
	}
}

// コンテナレベルのタッチハンドラ（キャンバス外でも2本指操作を可能にする）
function handleContainerTouchStart(e: TouchEvent) {
	// すべてのタッチをhandleTouchStartで処理
	// 1本指: 描画
	// 2本指: パン/ズーム
	handleTouchStart(e);
}

function handleContainerTouchMove(e: TouchEvent) {
	// すべてのタッチムーブをhandleTouchMoveで処理
	handleTouchMove(e);
}

function handleContainerTouchEnd(e: TouchEvent) {
	// すべてのタッチ終了をhandleTouchEndで処理
	handleTouchEnd(e);
}

// パフォーマンス監視
function monitorPerformance() {
	const stats = {
		strokeCount: strokeHistory.value.length,
		canvasSize: `${canvasWidth.value}x${canvasHeight.value}`,
		memoryUsage: (performance as any).memory ? {
			used: Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024),
			total: Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024),
			limit: Math.round((performance as any).memory.jsHeapSizeLimit / 1024 / 1024),
		} : 'N/A',
		timestamp: new Date().toISOString(),
	};

	// メモリ使用量が多い場合は警告
	if (typeof stats.memoryUsage === 'object' && stats.memoryUsage.used > 100) {
		console.warn('🎨 [WARN] High memory usage detected, consider rasterization');
		if (strokeHistory.value.length > rasterizeThreshold * 0.8) {
			performRasterization();
		}
	}

	return stats;
}

// 他のユーザーのアンドゥに対応（新バージョン）
function handleUndoStroke(data: any) {
	if (!ctx) return;

	// リモートユーザーのアンドゥの場合、サーバーから最新データを再取得
	loadCanvasData();
}

// キャンバスデータ読み込み
async function loadCanvasData() {
	try {
		const response = await fetch('/api/drawing/canvas', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${$i.token}`,
			},
			body: JSON.stringify({
				roomId: drawingId.value,
			}),
		});

		if (response.ok) {
			const strokes = await response.json();

			for (let i = 0; i < MAX_LAYERS; i++) {
				const layerCtx = layerContexts.value[i];
				if (layerCtx) {
					layerCtx.clearRect(0, 0, canvasWidth.value, canvasHeight.value);
				}
			}

			layerStrokeHistory.value = Array.from({ length: MAX_LAYERS }, () => []);
			strokeHistory.value = [];
			undoStack.value = [];
			redoStack.value = [];
			otherActiveStrokes.value.clear();

			for (const stroke of strokes) {
				renderStrokeOnLayer(stroke);
			}

			ctx = layerContexts.value[currentLayer.value] ?? ctx;
		}
	} catch (error) {
		console.warn('🎨 [WARN] Failed to load canvas data:', error);
	}
}

// ストローク履歴管理
function addStrokeToHistory(strokeData: any) {
	// 新しいストロークを追加する前に、現在の状態をundoスタックに保存
	if (ctx) {
		const currentState = {
			history: [...strokeHistory.value],
			imageData: ctx.getImageData(0, 0, canvasWidth.value, canvasHeight.value),
		};
		undoStack.value.push(currentState);

		// undoスタックのサイズ制限
		if (undoStack.value.length > maxUndoHistory) {
			undoStack.value.shift();
		}
	}

	// 新しいストロークを追加したらredoスタックをクリア
	redoStack.value = [];

	const layerIndex = clampLayerIndex(currentLayer.value);
	const strokeWithMeta = {
		...strokeData,
		layer: layerIndex,
		userId: $i.id,
		userName: $i.username ?? $i.name ?? null,
	};
	const normalized = renderStrokeOnLayer(strokeWithMeta, { suppressRender: true });
	if (!normalized) {
		return;
	}
	strokeHistory.value.push(normalized);

	// アンドゥ履歴の制限
	if (strokeHistory.value.length > maxUndoHistory) {
		// 古いストロークを削除し、必要に応じてラスタライズ
		const oldStrokesToRemove = strokeHistory.value.length - maxUndoHistory;
		strokeHistory.value.splice(0, oldStrokesToRemove);
	}

	// ラスタライズの判定
	if (strokeHistory.value.length >= rasterizeThreshold) {
		performRasterization();
	}
}

// ラスタライズ実行
function performRasterization() {
	if (!ctx || !canvasEl.value) return;

	try {
		// 現在のキャンバス内容を画像として保存
		const imageData = canvasEl.value.toDataURL();

		// キャンバスをクリアして再描画
		ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value);

		// 保存した画像を背景として描画
		const img = new Image();
		img.onload = () => {
			ctx!.drawImage(img, 0, 0);
		};
		img.src = imageData;

		// ストローク履歴をクリア（ラスタライズ後は元に戻せない）
		strokeHistory.value = [];

		// サーバーに通知（他のユーザーとの同期用）
		if (connection.value) {
			try {
				connection.value.send('canvasRasterized', {
					imageData: imageData,
					timestamp: Date.now(),
				});
			} catch (error) {
				console.warn('🎨 [WARN] Failed to send rasterization notification:', error);
			}
		}
	} catch (error) {
		console.error('🎨 [ERROR] Rasterization failed:', error);
	}
}

// 改良されたアンドゥ機能
function performAdvancedUndo() {
	if (strokeHistory.value.length === 0) {
		console.warn('🎨 [WARN] No strokes to undo');
		return;
	}

	// 最後のストロークを削除
	const removedStroke = strokeHistory.value.pop();

	// キャンバスを再描画
	redrawCanvasFromHistory();

	// サーバーに通知
	if (connection.value) {
		try {
			connection.value.send('undoStroke', {
				userId: $i.id,
				timestamp: Date.now(),
				strokeId: removedStroke?.timestamp,
			});
		} catch (error) {
			console.warn('🎨 [WARN] Failed to send undo notification:', error);
		}
	}
}

// 履歴からキャンバスを再描画
function redrawCanvasFromHistory() {
	// 全レイヤーを再描画
	for (let i = 0; i < MAX_LAYERS; i++) {
		const layerCtx = layerContexts.value[i];
		if (!layerCtx) continue;

		// レイヤーをクリア
		layerCtx.clearRect(0, 0, canvasWidth.value, canvasHeight.value);

		// このレイヤーの履歴から再描画
		for (const stroke of layerStrokeHistory.value[i]) {
			// 一時的にコンテキストを切り替えて描画
			const originalCtx = ctx;
			ctx = layerCtx;
			drawSmoothPathLocal(
				stroke.points,
				stroke.strokeWidth,
				stroke.color,
				stroke.opacity,
				stroke.tool === 'eraser',
			);
			ctx = originalCtx;
		}
	}
}

// チャットオーバーレイ表示
function showChatOverlay(message: any) {
	if (message.fromUserId === $i.id) return;

	chatOverlay.value = {
		user: message.fromUser,
		text: message.text,
	};

	// 3秒後に非表示
	setTimeout(() => {
		chatOverlay.value = null;
	}, 3000);
}

// 全画面モード制御
async function toggleFullscreen() {
	try {
		if (!document.fullscreenElement) {
			const rootElement = document.querySelector('.drawing-root') as HTMLElement;
			if (rootElement) {
				await rootElement.requestFullscreen();
			}
		} else {
			await document.exitFullscreen();
		}
	} catch (error) {
		console.warn('🎨 [WARN] Fullscreen toggle failed:', error);
	}
}

// 全画面状態変更ハンドラー
function handleFullscreenChange() {
	isFullscreen.value = !!document.fullscreenElement;

	// 全画面モード時にタッチデバイス向けのスタイル調整
	if (isFullscreen.value && isTouchDevice.value) {
		// キャンバスサイズを動的に調整
		nextTick(() => {
			adjustCanvasForMobile();
		});
	}
}

// スマホ向けキャンバス調整
function adjustCanvasForMobile() {
	if (!canvasEl.value || !isTouchDevice.value) return;

	const container = canvasEl.value.parentElement;
	if (!container) return;

	// コンテナサイズに合わせてキャンバスを調整
	const containerRect = container.getBoundingClientRect();
	const maxWidth = containerRect.width - 32; // padding考慮
	const maxHeight = containerRect.height - 32;

	// アスペクト比を維持しながらリサイズ
	const aspectRatio = canvasWidth.value / canvasHeight.value;
	let newWidth = maxWidth;
	let newHeight = maxWidth / aspectRatio;

	if (newHeight > maxHeight) {
		newHeight = maxHeight;
		newWidth = maxHeight * aspectRatio;
	}

	canvasEl.value.style.width = `${newWidth}px`;
	canvasEl.value.style.height = `${newHeight}px`;
}
</script>

<style lang="scss" module>
.root {
	display: flex;
	flex-direction: column;
	height: calc(100vh - 100px);
	max-height: calc(100vh - 100px);
	overflow: hidden;
	background: var(--MI_THEME-panel);

	&:fullscreen {
		background: #000000;

		.toolbar {
			background: rgba(0, 0, 0, 0.8);
			backdrop-filter: blur(8px);
			border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		}

		.canvasContainer {
			background: #000000;
			padding: 8px;
		}
	}
}

// モバイル用ツールバー開閉ボタン
.toolbarToggle {
	position: fixed;
	bottom: 20px;
	right: 20px;
	width: 56px;
	height: 56px;
	border-radius: 50%;
	background: var(--MI_THEME-accent);
	color: var(--MI_THEME-accentForeground);
	border: none;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 24px;
	cursor: pointer;
	z-index: 1000;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

	&:hover {
		transform: scale(1.1);
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
	}

	&:active {
		transform: scale(0.95);
	}

	i {
		transition: transform 0.3s ease;
	}

	&.toolbarToggleOpen {
		background: var(--MI_THEME-error);

		i {
			transform: rotate(90deg);
		}
	}
}

.toolbar {
	display: flex;
	align-items: center;
	gap: 16px;
	padding: 12px 16px;
	background: var(--MI_THEME-bg);
	border-bottom: 1px solid var(--MI_THEME-divider);
	flex-wrap: wrap;
	overflow-x: auto;
	scrollbar-width: none;
	-ms-overflow-style: none;

	&::-webkit-scrollbar {
		display: none;
	}

	// モバイル用フローティングツールバー
	&.toolbarMobile {
		position: fixed;
		bottom: 90px;
		left: 50%;
		transform: translateX(-50%) translateY(150%);
		width: 90%;
		max-width: 500px;
		max-height: 60vh;
		overflow-y: auto;
		border-radius: 16px;
		border: 1px solid var(--MI_THEME-divider);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
		backdrop-filter: blur(12px);
		background: rgba(var(--MI_THEME-panel-rgb), 0.95);
		z-index: 999;
		transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		padding: 16px;
		gap: 12px;

		&.toolbarMobileOpen {
			transform: translateX(-50%) translateY(0);
		}
	}
}

@container (max-width: 500px) {
	.toolbar {
		gap: 8px;
		padding: 8px 12px;
		flex-wrap: wrap;
		justify-content: center;

		.actionGroup {
			margin-left: 0;
			width: 100%;
			justify-content: center;
		}
	}

	.toolGroup {
		gap: 2px;
	}

	.colorPalette {
		gap: 2px;
		max-width: 200px;
		flex-wrap: wrap;
	}

	.strokeWidthGroup {
		gap: 4px;
		.label {
			display: none;
		}
	}

	.strokeWidthButton {
		width: 36px;
		height: 36px;
	}

	.opacityGroup {
		gap: 4px;
		.label {
			display: none;
		}
	}

	.toolButton {
		width: 44px;
		height: 44px;
		font-size: 18px;
	}

	.colorButton {
		width: 28px;
		height: 28px;
	}

	.colorPickerButton {
		width: 28px;
		height: 28px;
	}

	.fullscreenButton,
	.saveButton,
	.clearButton {
		min-width: 44px;
		height: 44px;
		span {
			display: none;
		}
	}
}

.toolGroup {
	display: flex;
	gap: 4px;
}

.toolButton {
	width: 36px;
	height: 36px;
	border: 1px solid var(--MI_THEME-divider);
	background: var(--MI_THEME-panel);
	border-radius: 6px;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s;

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}

	&.active {
		background: var(--MI_THEME-accent);
		color: var(--MI_THEME-fgOnAccent);
		border-color: var(--MI_THEME-accent);
	}
}

.colorPalette {
	display: flex;
	gap: 4px;
	flex-wrap: wrap;
}

.colorButton {
	width: 24px;
	height: 24px;
	border: 2px solid var(--MI_THEME-divider);
	border-radius: 4px;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		transform: scale(1.1);
	}

	&.activeColor {
		border-color: var(--MI_THEME-accent);
		box-shadow: 0 0 0 2px var(--MI_THEME-accent);
	}
}

.colorPickerButton {
	width: 24px;
	height: 24px;
	border: 2px solid var(--MI_THEME-divider);
	border-radius: 4px;
	cursor: pointer;
	background: var(--MI_THEME-buttonBg);
	color: var(--MI_THEME-fg);
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s;

	i {
		font-size: 14px;
	}

	&:hover {
		transform: scale(1.1);
		background: var(--MI_THEME-buttonHoverBg);
	}
}

.strokeWidthGroup {
	display: flex;
	align-items: center;
	gap: 6px;
}

.strokeWidthButton {
	width: 32px;
	height: 32px;
	border: 1px solid var(--MI_THEME-divider);
	background: var(--MI_THEME-panel);
	border-radius: 4px;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s;

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}

	&.active {
		background: var(--MI_THEME-accent);
		border-color: var(--MI_THEME-accent);
	}
}

.strokePreview {
	background: var(--MI_THEME-fg);
	border-radius: 50%;
	transition: all 0.2s;

	.strokeWidthButton.active & {
		background: var(--MI_THEME-fgOnAccent);
	}
}

.opacityGroup {
	display: flex;
	align-items: center;
	gap: 6px;
}

.label {
	font-size: 12px;
	color: var(--MI_THEME-fg);
}

.opacityButton {
	padding: 4px 8px;
	border: 1px solid var(--MI_THEME-divider);
	background: var(--MI_THEME-panel);
	border-radius: 4px;
	cursor: pointer;
	font-size: 11px;
	transition: all 0.2s;

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}

	&.active {
		background: var(--MI_THEME-accent);
		color: var(--MI_THEME-fgOnAccent);
		border-color: var(--MI_THEME-accent);
	}
}

.zoomGroup {
	display: flex;
	align-items: center;
	gap: 6px;
	margin-left: auto;
	margin-right: 8px;

	.label {
		font-size: 12px;
		color: var(--MI_THEME-fg);
		font-weight: 500;
	}

	.zoomDisplay {
		font-size: 14px;
		font-weight: bold;
		color: var(--MI_THEME-accent);
		min-width: 40px;
		text-align: center;
	}

	.zoomButton,
	.zoomResetButton {
		padding: 4px 8px;
		border: 1px solid var(--MI_THEME-divider);
		background: var(--MI_THEME-panel);
		border-radius: 4px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--MI_THEME-fg);
		transition: all 0.2s ease;

		&:hover {
			background: var(--MI_THEME-buttonHoverBg);
			color: var(--MI_THEME-accent);
		}

		&:active {
			transform: scale(0.95);
		}

		i {
			font-size: 14px;
		}
	}
}

.layerGroup {
	display: flex;
	align-items: center;
	gap: 4px;
	margin-right: 8px;

	.label {
		font-size: 12px;
		color: var(--MI_THEME-fg);
		font-weight: 500;
	}
}

.layerButton {
	padding: 4px 12px;
	border: 1px solid var(--MI_THEME-divider);
	background: var(--MI_THEME-panel);
	border-radius: 4px;
	cursor: pointer;
	font-size: 14px;
	font-weight: bold;
	color: var(--MI_THEME-fg);
	transition: all 0.2s ease;
	min-width: 32px;

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}

	&.active {
		background: var(--MI_THEME-accent);
		color: var(--MI_THEME-fgOnAccent);
		border-color: var(--MI_THEME-accent);
	}
}

.layerMenuButton {
	padding: 4px 8px;
	border: 1px solid var(--MI_THEME-divider);
	background: var(--MI_THEME-panel);
	border-radius: 4px;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	color: var(--MI_THEME-fg);
	transition: all 0.2s ease;

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
		color: var(--MI_THEME-accent);
	}

	i {
		font-size: 16px;
	}
}

.undoRedoGroup {
	display: flex;
	gap: 4px;
	margin-right: 8px;
}

.undoButton,
.redoButton {
	padding: 6px 12px;
	border: 1px solid var(--MI_THEME-divider);
	background: var(--MI_THEME-panel);
	border-radius: 6px;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 4px;
	color: var(--MI_THEME-fg);
	transition: all 0.2s;

	&:hover:not(.disabled) {
		background: var(--MI_THEME-accentedBg);
	}

	&.disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
}

.actionGroup {
	margin-left: auto;
	display: flex;
	gap: 8px;
}

.fullscreenButton {
	padding: 6px 12px;
	border: 1px solid var(--MI_THEME-divider);
	background: var(--MI_THEME-panel);
	border-radius: 6px;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 4px;
	color: var(--MI_THEME-accent);
	transition: all 0.2s;

	&:hover {
		background: var(--MI_THEME-accentedBg);
	}
}

.settingsButton {
	padding: 6px 12px;
	border: 1px solid var(--MI_THEME-divider);
	background: var(--MI_THEME-panel);
	border-radius: 6px;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 4px;
	color: var(--MI_THEME-fg);
	transition: all 0.2s;

	&:hover {
		background: var(--MI_THEME-accentedBg);
	}
}

.debugExportButton {
	padding: 6px 12px;
	border: 1px solid var(--MI_THEME-divider);
	background: var(--MI_THEME-panel);
	border-radius: 6px;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 4px;
	color: var(--MI_THEME-fg);
	transition: all 0.2s;

	&:hover {
		background: var(--MI_THEME-accentedBg);
	}
}

.saveButton {
	padding: 6px 12px;
	border: 1px solid var(--MI_THEME-divider);
	background: var(--MI_THEME-panel);
	border-radius: 6px;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 4px;
	color: var(--MI_THEME-accent);
	transition: all 0.2s;

	&:hover {
		background: var(--MI_THEME-accentedBg);
	}
}

.clearButton {
	padding: 6px 12px;
	border: 1px solid var(--MI_THEME-divider);
	background: var(--MI_THEME-panel);
	border-radius: 6px;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 4px;
	color: var(--MI_THEME-error);
	transition: all 0.2s;

	&:hover {
		background: var(--MI_THEME-errorBg);
	}
}

.canvasContainer {
	flex: 1;
	position: relative;
	overflow: hidden;
	display: flex;
	justify-content: center;
	align-items: center;
	background: #f5f5f5;
	padding: 16px;
	touch-action: none; /* ネイティブタッチ操作を無効化 */
}

.canvas {
	position: absolute;
	top: 50%;
	left: 50%;
	border: 1px solid var(--MI_THEME-divider);
	touch-action: none;
	border-radius: 8px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	background: transparent;
	box-sizing: border-box;
}

.backgroundLayer {
	background: #ffffff;
	pointer-events: none;
	z-index: 0;
}

.layerCanvas {
	background: transparent;
}

@container (max-width: 600px) {
	.canvasContainer {
		padding: 4px;
	}

	.canvas {
		max-width: calc(100vw - 8px);
		max-height: calc(100vh - 120px); /* ツールバー分を考慮 */
		border-radius: 4px;
		object-fit: contain;
	}
}

@container (max-width: 400px) {
	.canvasContainer {
		padding: 2px;
	}

	.canvas {
		max-width: calc(100vw - 4px);
		max-height: calc(100vh - 100px); /* ツールバー分を考慮 */
		border-radius: 4px;
		object-fit: contain;
	}
}

// 全画面モード時の最適化
.root:fullscreen {
	@container (max-width: 1000px) {
		.toolbar {
			padding: 6px;
			gap: 6px;
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			z-index: 1000;
		}

		.canvasContainer {
			padding-top: 60px; /* ツールバーの高さ分 */
		}
	}

	.canvas {
		max-width: 95vw;
		max-height: 85vh;
		width: auto !important;
		height: auto !important;
		border: 2px solid rgba(255, 255, 255, 0.3);
		box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
	}
}

.cursor {
	position: absolute;
	pointer-events: none;
	z-index: 10;
	font-size: 18px;
	transition: all 0.1s ease;
	filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.cursorUser {
	position: absolute;
	top: -32px;
	left: 22px;
	padding: 4px 8px;
	border-radius: 6px;
	font-size: 12px;
	font-weight: 500;
	white-space: nowrap;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
	border: 1px solid rgba(255, 255, 255, 0.2);
	backdrop-filter: blur(4px);
	animation: fadeInCursor 0.2s ease;
}

@keyframes fadeInCursor {
	from {
		opacity: 0;
		transform: scale(0.8) translateY(4px);
	}
	to {
		opacity: 1;
		transform: scale(1) translateY(0);
	}
}

.chatOverlay {
	position: absolute;
	bottom: 20px;
	left: 20px;
	z-index: 20;
}

.chatBubble {
	display: flex;
	align-items: center;
	gap: 8px;
	background: var(--MI_THEME-panel);
	border: 1px solid var(--MI_THEME-divider);
	border-radius: 12px;
	padding: 8px 12px;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	max-width: 300px;
}

.chatAvatar {
	flex-shrink: 0;
}

.chatText {
	font-size: 14px;
	color: var(--MI_THEME-fg);
}

.chat-overlay-enter-active,
.chat-overlay-leave-active {
	transition: all 0.3s ease;
}

.chat-overlay-enter-from,
.chat-overlay-leave-to {
	opacity: 0;
	transform: translateY(20px);
}

// マウス補正設定スタイル
.mouseCorrectionGroup {
	display: flex;
	align-items: center;
	gap: 4px;
	padding: 4px;
	background: var(--MI_THEME-buttonBg);
	border-radius: 6px;
}

.correctionButton {
	background: transparent;
	border: 1px solid var(--MI_THEME-divider);
	border-radius: 4px;
	padding: 6px;
	color: var(--MI_THEME-fg);
	cursor: pointer;
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 28px;
	font-size: 14px;

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
		color: var(--MI_THEME-accent);
		border-color: var(--MI_THEME-accent);
	}

	&.active {
		background: var(--MI_THEME-accent);
		color: var(--MI_THEME-accentFg);
		border-color: var(--MI_THEME-accent);
		box-shadow: 0 0 4px rgba(var(--MI_THEME-accent-rgb), 0.3);
	}

	i {
		font-size: 12px;
	}
}

.touchCorrectionGroup {
	display: flex;
	align-items: center;
	gap: 4px;
	padding: 4px;
	background: var(--MI_THEME-buttonBg);
	border-radius: 6px;
}

.correctionLevelGroup {
	display: flex;
	align-items: center;
	gap: 2px;
	margin-left: 4px;
}

.levelLabel {
	font-size: 10px;
	color: var(--MI_THEME-fgTransparentWeak);
	margin-right: 2px;
}

.levelButton {
	background: transparent;
	border: 1px solid var(--MI_THEME-divider);
	color: var(--MI_THEME-fg);
	padding: 4px;
	border-radius: 3px;
	cursor: pointer;
	transition: all 0.2s ease;
	width: 24px;
	height: 24px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 11px;
	font-weight: bold;

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
		border-color: var(--MI_THEME-accent);
		color: var(--MI_THEME-accent);
	}

	&.active {
		background: var(--MI_THEME-accent);
		color: var(--MI_THEME-accentFg);
		border-color: var(--MI_THEME-accent);
		box-shadow: 0 0 4px rgba(var(--MI_THEME-accent-rgb), 0.3);
	}
}

@container (max-width: 500px) {
	.mouseCorrectionGroup, .touchCorrectionGroup {
		gap: 2px;
	}

	.correctionButton {
		width: 24px;
		height: 24px;
		padding: 4px;

		i {
			font-size: 10px;
		}
	}

	.levelButton {
		width: 20px;
		height: 20px;
		font-size: 9px;
	}

	.levelLabel {
		font-size: 8px;
	}
}

.debugButton {
	padding: 4px 8px;
	border: 1px solid var(--MI_THEME-divider);
	background: var(--MI_THEME-panel);
	border-radius: 4px;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	color: var(--MI_THEME-fg);
	transition: all 0.2s ease;
	margin-left: 4px;

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
		color: var(--MI_THEME-accent);
		border-color: var(--MI_THEME-accent);
	}

	i {
		font-size: 16px;
	}
}

.debugPanel {
	position: absolute;
	top: 10px;
	right: 10px;
	background: var(--MI_THEME-panel);
	border: 1px solid var(--MI_THEME-divider);
	border-radius: 8px;
	width: 320px;
	max-height: 80vh;
	overflow-y: auto;
	z-index: 1000;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.debugHeader {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 12px 16px;
	border-bottom: 1px solid var(--MI_THEME-divider);
	background: var(--MI_THEME-bg);

	h4 {
		margin: 0;
		font-size: 14px;
		font-weight: bold;
		color: var(--MI_THEME-fg);
	}
}

.debugCloseButton {
	background: none;
	border: none;
	color: var(--MI_THEME-fg);
	cursor: pointer;
	font-size: 18px;
	padding: 2px 6px;
	border-radius: 4px;

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}
}

.debugContent {
	padding: 8px 12px;
	font-size: 11px;
	line-height: 1.3;
}

.debugSection {
	margin-bottom: 12px;

	h5 {
		margin: 0 0 4px 0;
		font-size: 12px;
		font-weight: bold;
		color: var(--MI_THEME-accent);
	}

	p {
		margin: 2px 0;
		color: var(--MI_THEME-fg);
		font-family: monospace;
		background: var(--MI_THEME-bg);
		padding: 2px 4px;
		border-radius: 2px;
		word-break: break-all;
	}
}

@container (max-width: 500px) {
	.debugPanel {
		width: 280px;
		right: 5px;
		top: 5px;
		max-height: 70vh;
	}

	.debugContent {
		font-size: 10px;
		padding: 6px 8px;
	}

	.debugSection {
		margin-bottom: 8px;

		h5 {
			font-size: 11px;
		}
	}
}

// 通信ログパネル
.commLogPanel {
	position: absolute;
	top: 10px;
	left: 10px;
	background: var(--MI_THEME-panel);
	border: 1px solid var(--MI_THEME-divider);
	border-radius: 8px;
	width: 420px;
	max-height: 80vh;
	overflow-y: hidden;
	z-index: 1000;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	display: flex;
	flex-direction: column;
}

.commLogHeader {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 12px 16px;
	border-bottom: 1px solid var(--MI_THEME-divider);
	background: var(--MI_THEME-bg);
	flex-shrink: 0;

	h4 {
		margin: 0;
		font-size: 14px;
		font-weight: bold;
		color: var(--MI_THEME-fg);
	}
}

.commLogActions {
	display: flex;
	gap: 8px;
}

.commLogClearButton {
	background: var(--MI_THEME-buttonBg);
	border: 1px solid var(--MI_THEME-buttonBorder);
	color: var(--MI_THEME-fg);
	cursor: pointer;
	font-size: 12px;
	padding: 4px 12px;
	border-radius: 4px;

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}
}

.commLogCloseButton {
	background: none;
	border: none;
	color: var(--MI_THEME-fg);
	cursor: pointer;
	font-size: 18px;
	padding: 2px 6px;
	border-radius: 4px;

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}
}

.commLogContent {
	padding: 8px;
	font-size: 11px;
	line-height: 1.3;
	overflow-y: auto;
	flex: 1;
	min-height: 0;
}

.commLogEmpty {
	color: var(--MI_THEME-fgTransparentWeak);
	text-align: center;
	padding: 20px;
}

.commLogEntry {
	margin-bottom: 8px;
	padding: 8px;
	border-radius: 4px;
	border-left: 3px solid;
	background: var(--MI_THEME-bg);
}

.commLogsend {
	border-left-color: #4caf50;
	background: rgba(76, 175, 80, 0.05);
}

.commLogreceive {
	border-left-color: #2196f3;
	background: rgba(33, 150, 243, 0.05);
}

.commLogTime {
	font-size: 10px;
	color: var(--MI_THEME-fgTransparentWeak);
	margin-bottom: 4px;
	font-family: monospace;
}

.commLogType {
	display: flex;
	gap: 8px;
	margin-bottom: 4px;
}

.commLogDirection {
	font-weight: bold;
	font-size: 10px;
	padding: 2px 6px;
	border-radius: 3px;

	.commLogsend & {
		background: #4caf50;
		color: white;
	}

	.commLogreceive & {
		background: #2196f3;
		color: white;
	}
}

.commLogEventType {
	font-family: monospace;
	font-size: 11px;
	color: var(--MI_THEME-fg);
}

.commLogData {
	margin-top: 4px;
	font-family: monospace;
	font-size: 10px;
	color: var(--MI_THEME-fg);
	background: var(--MI_THEME-panel);
	padding: 4px 6px;
	border-radius: 3px;
	overflow-x: auto;
	white-space: pre-wrap;
	word-break: break-all;

	pre {
		margin: 0;
	}
}

/* ウォーターマーク関連 */
.watermarkGroup {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 4px 12px;
	background: var(--MI_THEME-panel);
	border-radius: 8px;
	margin: 4px 0;
}

.watermarkOverlay {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	pointer-events: none;
	overflow: hidden;
	z-index: 5;
}

.watermarkTiles {
	position: absolute;
	top: -100px;
	left: -100px;
	width: calc(100% + 200px);
	height: calc(100% + 200px);
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
	gap: 30px;
	padding: 20px;
	transform: rotate(-15deg);
	pointer-events: none;
}

.watermarkImage {
	width: 60px;
	height: auto;
	opacity: 0.1;
	object-fit: contain;
	user-select: none;
	pointer-events: none;
}

.commLogButton {
	padding: 6px 12px;
	border: 1px solid var(--MI_THEME-divider);
	background: var(--MI_THEME-panel);
	border-radius: 6px;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 4px;
	color: var(--MI_THEME-fg);
	transition: all 0.2s;

	&:hover {
		background: var(--MI_THEME-accentedBg);
	}
}

@container (max-width: 500px) {
	.commLogPanel {
		width: calc(100vw - 20px);
		left: 10px;
		top: 10px;
		max-height: 60vh;
	}

	.commLogContent {
		font-size: 10px;
		padding: 6px;
	}

	.commLogEntry {
		margin-bottom: 6px;
		padding: 6px;
	}
}

/* 他のユーザーのカーソル */
.cursor {
	position: absolute;
	pointer-events: none;
	z-index: 1000;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 4px;
}

.cursorPointer {
	width: 0;
	height: 0;
	border-left: 12px solid currentColor;
	border-top: 6px solid transparent;
	border-bottom: 6px solid transparent;
	filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
	margin-left: 25px;
	margin-top: 41px;
}

.cursorLabel {
	padding: 3px 8px;
	border-radius: 6px;
	font-size: 12px;
	font-weight: 600;
	white-space: nowrap;
	box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
	margin-left: 2px;
}
</style>
