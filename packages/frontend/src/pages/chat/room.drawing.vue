<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[$style.root, 'drawing-root']">
	<!-- ツールバー -->
	<div :class="$style.toolbar">
		<div :class="$style.toolGroup">
			<button
				:class="[$style.toolButton, { [$style.active]: currentTool === 'pen' }]"
				@click="setTool('pen')"
				title="鉛筆"
			>
				<i class="ti ti-pencil"></i>
			</button>
			<button
				:class="[$style.toolButton, { [$style.active]: currentTool === 'eraser' }]"
				@click="setTool('eraser')"
				title="消しゴム"
			>
				<i class="ti ti-eraser"></i>
			</button>
			<button
				:class="[$style.toolButton, { [$style.active]: currentTool === 'eyedropper' }]"
				@click="setTool('eyedropper')"
				title="スポイト"
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
				@click="setColor(color)"
			></button>
		</div>

		<!-- 線の太さ調整 -->
		<div :class="$style.strokeWidthGroup">
			<span :class="$style.label">太さ:</span>
			<button
				v-for="width in strokeWidthLevels"
				:key="width"
				:class="[$style.strokeWidthButton, { [$style.active]: strokeWidth === width }]"
				@click="setStrokeWidth(width)"
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
				@click="setOpacity(opacity)"
			>
				{{ Math.round(opacity * 100) }}%
			</button>
		</div>

		<!-- 拡大縮小グループ -->
		<div :class="$style.zoomGroup" v-if="isTouchDevice">
			<span :class="$style.label">倍率:</span>
			<span :class="$style.zoomDisplay">{{ Math.round(zoomLevel * 100) }}%</span>
			<button :class="$style.zoomResetButton" @click="resetZoom" title="倍率をリセット">
				<i class="ti ti-zoom-reset"></i>
			</button>
		</div>

		<!-- アクションボタン -->
		<div :class="$style.actionGroup">
			<button :class="$style.fullscreenButton" @click="toggleFullscreen" :title="isFullscreen ? '全画面を終了' : '全画面モード'">
				<i :class="isFullscreen ? 'ti ti-minimize' : 'ti ti-maximize'"></i>
				<span v-if="!isTouchDevice">{{ isFullscreen ? '終了' : '全画面' }}</span>
			</button>
			<button :class="$style.saveButton" @click="saveCanvas" title="キャンバスを保存">
				<i class="ti ti-device-floppy"></i>
				<span v-if="!isTouchDevice">保存</span>
			</button>
			<button :class="$style.clearButton" @click="clearCanvas" title="キャンバスをクリア">
				<i class="ti ti-trash"></i>
				<span v-if="!isTouchDevice">クリア</span>
			</button>
		</div>

		<!-- 手ブレ補正設定 -->
		<div :class="$style.mouseCorrectionGroup" v-if="!isTouchDevice">
			<span :class="$style.label">手ブレ補正:</span>
			<button
				:class="[$style.correctionButton, { [$style.active]: handShakeCorrection.enabled.value }]"
				@click="handShakeCorrection.enabled.value = !handShakeCorrection.enabled.value"
				title="手ブレスムージング"
			>
				<i class="ti ti-wand"></i>
			</button>
			<button
				:class="[$style.correctionButton, { [$style.active]: handShakeCorrection.pressureSimulation.value }]"
				@click="handShakeCorrection.pressureSimulation.value = !handShakeCorrection.pressureSimulation.value"
				title="筆圧シミュレーション"
			>
				<i class="ti ti-brush"></i>
			</button>
			<button
				:class="[$style.correctionButton, { [$style.active]: handShakeCorrection.stabilization.value }]"
				@click="handShakeCorrection.stabilization.value = !handShakeCorrection.stabilization.value"
				title="手ぶれ補正"
			>
				<i class="ti ti-hand-stop"></i>
			</button>
		</div>
	</div>

	<!-- キャンバス -->
	<div :class="$style.canvasContainer">
		<canvas
			ref="canvasEl"
			:class="$style.canvas"
			:width="canvasWidth"
			:height="canvasHeight"
			:style="{
				width: displayWidth + 'px',
				height: displayHeight + 'px',
				transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
				transformOrigin: isTouchDevice ? `${zoomCenter.x}px ${zoomCenter.y}px` : 'center',
				transition: (isPanning || isZooming) ? 'none' : 'transform 0.2s ease'
			}"
			@mousedown="startDrawing"
			@mousemove="draw"
			@mouseup="stopDrawing"
			@mouseleave="stopDrawing"
			@touchstart="handleTouchStart"
			@touchmove="handleTouchMove"
			@touchend="handleTouchEnd"
		></canvas>

		<!-- 他のユーザーのカーソル -->
		<div
			v-for="cursor in otherCursors"
			:key="cursor.userId"
			:class="$style.cursor"
			:style="{
				left: (cursor.x + panOffset.x) + 'px',
				top: (cursor.y + panOffset.y) + 'px',
				color: getUserCursorColor(cursor.userId)
			}"
		>
			<i class="ti ti-hand-click"></i>
			<span
				:class="$style.cursorUser"
				:style="{
					background: getUserCursorColor(cursor.userId),
					color: getContrastColor(getUserCursorColor(cursor.userId))
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
import { useStream } from '@/stream.js';
import { ensureSignin } from '@/i.js';
import * as os from '@/os.js';
import MkAvatar from '@/components/global/MkAvatar.vue';

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
const canvasWidth = 800; // 800x600の標準サイズ
const canvasHeight = 600;
const displayWidth = 800; // 表示サイズ（キャンバスサイズと同じ）
const displayHeight = 600;
let ctx: CanvasRenderingContext2D | null = null;

// 描画状態
const isDrawing = ref(false);
const currentTool = ref<'pen' | 'eraser' | 'eyedropper'>('pen');
const currentColor = ref('#000000');
const currentOpacity = ref(1);
const strokeWidth = ref(2);

// ツール別の線の太さを記憶
const toolStrokeWidths = ref({
	pen: 2,
	eraser: 10
});

// 全画面モード
const isFullscreen = ref(false);

// タッチデバイス検出
const isTouchDevice = ref(false);

// パン（移動）状態
const isPanning = ref(false);
const panOffset = ref({ x: 0, y: 0 });
const panStart = ref({ x: 0, y: 0 });
const lastTouchDistance = ref(0);

// ズーム（拡大縮小）状態
const zoomLevel = ref(1);
const zoomCenter = ref({ x: 0, y: 0 });
const minZoom = 0.5;
const maxZoom = 3.0;
const isZooming = ref(false);

// ジェスチャー状態管理
const gestureState = ref<'none' | 'pan' | 'zoom' | 'hybrid'>('none');
const initialDistance = ref(0);
const distanceHistory = ref<number[]>([]);
const panThreshold = 5; // パン開始の最小移動距離
const zoomThreshold = 15; // ズーム開始の最小距離変化

// アンドゥ用ダブルタップ検出
const lastTwoFingerTap = ref(0);
const twoFingerTapTimeout = 300; // ダブルタップの間隔（ms）

// 手ブレ補正設定
const handShakeCorrection = {
	enabled: ref(true),
	factor: 0.85, // スムージング係数 (0-1, 高いほど滑らか)
	minDistance: 1, // 最小移動距離（手ぶれ補正）
	velocitySmoothing: 0.7, // 速度スムージング係数
	pressureSimulation: ref(true), // 筆圧シミュレーション
	stabilization: ref(true), // 手ぶれ補正
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

// カラーパレット（少し濃いめのパステル調）
const colors = [
	'#2D2D2D', '#F5F5F5', '#E8A5A5', '#A5E8B0', '#A5C8E8', '#E8E8A5', '#D5A5E8', '#A5E8E8',
	'#E8C5A8', '#C5E8C5', '#C5D5E8', '#E8E5C5', '#DCC5E8', '#C5E8E5', '#D8D8D8', '#B0B0B0'
];

// 透明度レベル
const opacityLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

// 線の太さレベル
const strokeWidthLevels = [1, 2, 4, 6, 8, 12];

// パフォーマンス管理
const maxUndoHistory = 20; // アンドゥ履歴の最大数
const strokeHistory = ref<Array<any>>([]); // ストローク履歴
const rasterizeThreshold = 50; // ラスタライズを実行するストローク数

// WebSocket接続
const connection = ref<any>();

// 他のユーザーのカーソル
const otherCursors = ref<Array<{
	userId: string;
	userName: string;
	x: number;
	y: number;
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

onMounted(() => {
	if (canvasEl.value) {
		// 高解像度キャンバス設定（デバイスピクセル比対応）
		const dpr = window.devicePixelRatio || 1;

		// 物理サイズを設定
		canvasEl.value.width = canvasWidth * dpr;
		canvasEl.value.height = canvasHeight * dpr;

		// CSS表示サイズを維持
		canvasEl.value.style.width = canvasWidth + 'px';
		canvasEl.value.style.height = canvasHeight + 'px';

		ctx = canvasEl.value.getContext('2d', {
			alpha: true,
			desynchronized: false,
			colorSpace: 'srgb',
			willReadFrequently: false
		});

		if (ctx) {
			// DPR対応でスケール調整
			ctx.scale(dpr, dpr);

			// 最高品質のアンチエイリアス設定
			ctx.lineCap = 'round';
			ctx.lineJoin = 'round';
			ctx.imageSmoothingEnabled = true;
			ctx.imageSmoothingQuality = 'high';

			// より滑らかな描画のための最適化設定
			ctx.globalCompositeOperation = 'source-over';
			ctx.miterLimit = 10; // より滑らかなジョイント
			ctx.lineWidth = 2; // デフォルト線幅

			// サブピクセルレンダリング最適化（整数座標の場合のみ）
			// ctx.translate(0.5, 0.5); // モバイルで座標ずれが発生するためコメントアウト
			ctx.filter = 'none'; // フィルターをクリア
		}
	}

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

	// 全画面モード用のイベントリスナー
	document.addEventListener('fullscreenchange', handleFullscreenChange);

	// キャンバスサイズ変更監視でより正確な座標計算
	if (canvasEl.value && 'ResizeObserver' in window) {
		canvasRect.value = canvasEl.value.getBoundingClientRect();
		resizeObserver = new ResizeObserver(() => {
			if (canvasEl.value) {
				canvasRect.value = canvasEl.value.getBoundingClientRect();
			}
		});
		resizeObserver.observe(canvasEl.value);
	}

	// 定期的なパフォーマンス監視（30秒間隔）
	const performanceMonitor = setInterval(() => {
		monitorPerformance();
	}, 30000);

	// コンポーネント終了時にクリア
	onBeforeUnmount(() => {
		clearInterval(performanceMonitor);
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
			otherId: props.userId
		});
	} else {
		// ルームチャットの場合はchatRoomチャンネルを使用
		connection.value = stream.useChannel('chatRoom', {
			roomId: drawingId.value
		});
	}

	// お絵かき関連イベント
	connection.value.on('drawingStroke', (data: any) => {
		drawRemoteStroke(data);
	});

	connection.value.on('drawingProgress', (data: any) => {
		drawRemoteProgress(data);
	});

	connection.value.on('cursorMove', (data: any) => {
		updateOtherCursor(data);
	});

	connection.value.on('clearCanvas', () => {
		clearCanvasLocal();
	});

	connection.value.on('undoStroke', (data: any) => {
		handleUndoStroke(data);
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
}

function setColor(color: string) {
	currentColor.value = color;
	if (currentTool.value === 'eraser') {
		currentTool.value = 'pen';
	}
}

function setOpacity(opacity: number) {
	currentOpacity.value = opacity;
}

function setStrokeWidth(width: number) {
	strokeWidth.value = width;

	// 現在のツールの線の太さを記憶
	if (currentTool.value === 'pen' || currentTool.value === 'eraser') {
		toolStrokeWidths.value[currentTool.value] = width;
	}
}

// 描画開始
function startDrawing(event: MouseEvent | TouchEvent) {
	if (!ctx) return;

	isDrawing.value = true;

	// マウス補正状態をリセット
	lastTime = 0;
	velocityHistory.length = 0;
	pointBuffer.length = 0;

	const point = getEventPoint(event);
	currentPath = [point];

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

	const point = getEventPoint(event);

	// カーソル位置を他のユーザーに送信
	sendCursorPosition(point);

	if (!isDrawing.value || currentTool.value === 'eyedropper') return;

	currentPath.push(point);

	// ローカル描画
	drawLine(point);

	// リアルタイム描画進行状況を他のユーザーに送信
	sendDrawingProgress();
}

// 描画終了
function stopDrawing() {
	if (!isDrawing.value || currentPath.length === 0) return;

	isDrawing.value = false;

	// 滑らかな線描画で最終的な描画を実行
	if (currentPath.length > 2) {
		// 現在のパスを一度クリアして滑らかに再描画
		const tempPath = [...currentPath];

		// 高品質な滑らかな曲線で最終描画
		drawSmoothPath(
			tempPath,
			strokeWidth.value,
			currentColor.value,
			currentOpacity.value,
			currentTool.value === 'eraser'
		);
	}

	// ストローク履歴に追加
	const strokeData = {
		points: [...currentPath],
		tool: currentTool.value,
		color: currentColor.value,
		strokeWidth: strokeWidth.value,
		opacity: currentOpacity.value,
		timestamp: Date.now()
	};

	addStrokeToHistory(strokeData);

	// 描画データを他のユーザーに送信
	sendDrawingStroke();
	currentPath = [];
}

// 手ブレ補正関数
function applyHandShakeCorrection(rawPoint: { x: number; y: number }): { x: number; y: number } {
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
		Math.pow(rawPoint.y - lastPoint.y, 2)
	);
	const timeDelta = currentTime - lastTime;

	// 手ぶれ補正: 最小移動距離未満の場合は前の点を返す
	if (handShakeCorrection.stabilization.value && distance < handShakeCorrection.minDistance) {
		return smoothedPoint;
	}

	// 速度計算
	if (timeDelta > 0) {
		const currentVelocity = distance / timeDelta;
		velocity = velocity * handShakeCorrection.velocitySmoothing + currentVelocity * (1 - handShakeCorrection.velocitySmoothing);

		// 速度履歴を更新（最新5つを保持）
		velocityHistory.push(velocity);
		if (velocityHistory.length > 5) {
			velocityHistory.shift();
		}
	}

	// スムージング適用
	smoothedPoint = {
		x: smoothedPoint.x * handShakeCorrection.factor + rawPoint.x * (1 - handShakeCorrection.factor),
		y: smoothedPoint.y * handShakeCorrection.factor + rawPoint.y * (1 - handShakeCorrection.factor)
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

	// 速度に基づいて筆圧を計算
	const avgVelocity = velocityHistory.length > 0
		? velocityHistory.reduce((a, b) => a + b, 0) / velocityHistory.length
		: 0;

	// 速度が高いほど筆圧が低く（線が細く）、遅いほど筆圧が高く（線が太く）
	const normalizedVelocity = Math.min(avgVelocity / 2, 1); // 正規化
	const pressure = Math.max(0.3, 1.2 - normalizedVelocity); // 0.3-1.2の範囲

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
	const scaleX = canvasWidth / rect.width;
	const scaleY = canvasHeight / rect.height;

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
	const clampedX = Math.max(0, Math.min(canvasWidth, canvasX));
	const clampedY = Math.max(0, Math.min(canvasHeight, canvasY));

	return {
		x: clampedX,
		y: clampedY
	};
}

// イベントから座標を取得
function getEventPoint(event: MouseEvent | TouchEvent): { x: number; y: number } {
	const canvas = canvasEl.value!;

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
	let coordinates = screenToCanvasCoordinates(clientX, clientY);

	// キャンバス範囲内にクランプ
	coordinates.x = Math.max(0, Math.min(canvasWidth, coordinates.x));
	coordinates.y = Math.max(0, Math.min(canvasHeight, coordinates.y));

	// 手ブレ補正を適用
	return applyHandShakeCorrection(coordinates);
}

// ダグラス・ピューカー法による線の簡素化
function simplifyPath(points: Array<{ x: number; y: number }>, tolerance: number = 1.0): Array<{ x: number; y: number }> {
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
function smoothPoints(points: Array<{ x: number; y: number }>, windowSize: number = 3): Array<{ x: number; y: number }> {
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
			y: sumY / count
		});
	}

	return smoothed;
}

// 最高品質スムーズパス描画（複数アルゴリズム組み合わせ）
function drawSmoothPath(points: Array<{ x: number; y: number }>, strokeWidth?: number, color?: string, opacity?: number, isEraser: boolean = false) {
	if (!ctx || points.length < 2) return;

	ctx.save();

	// パラメータが指定された場合は描画設定を更新
	if (strokeWidth !== undefined) {
		ctx.lineWidth = strokeWidth;
	}
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
			y: (processedPoints[0].y + processedPoints[2].y) / 2
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
	if (!ctx || data.userId === $i.id) return;

	ctx.save();
	ctx.globalCompositeOperation = data.tool === 'eraser' ? 'destination-out' : 'source-over';
	ctx.strokeStyle = data.color;
	ctx.globalAlpha = data.opacity;
	ctx.lineWidth = data.strokeWidth;
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';

	// 最高品質な滑らかな描画を適用
	drawSmoothPath(
		data.points,
		data.strokeWidth,
		data.color,
		data.opacity,
		data.tool === 'eraser'
	);

	ctx.restore();

	// 進行中の描画があれば完了として削除
	if (otherActiveStrokes.value.has(data.userId)) {
		otherActiveStrokes.value.delete(data.userId);
	}

	// リモートストロークも履歴に追加（自動ラスタライズ管理用）
	addStrokeToHistory({
		points: data.points,
		tool: data.tool,
		color: data.color,
		strokeWidth: data.strokeWidth,
		opacity: data.opacity,
		timestamp: Date.now(),
		remote: true // リモートストロークフラグ
	});
}

// リモート描画進行状況（描画中）
function drawRemoteProgress(data: any) {
	if (!ctx || data.userId === $i.id) return;

	console.log('🎨 [DEBUG] Drawing remote progress from user:', data.userId, 'points:', data.points.length);

	// 進行中の描画を更新
	otherActiveStrokes.value.set(data.userId, {
		points: data.points,
		tool: data.tool,
		color: data.color,
		strokeWidth: data.strokeWidth,
		opacity: data.opacity,
		userId: data.userId
	});

	// キャンバスを再描画（進行中の描画を含む）
	redrawWithActiveStrokes();
}

// 進行中の描画を含むキャンバス再描画
function redrawWithActiveStrokes() {
	if (!ctx) return;

	// 現在のキャンバス状態を保存
	const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);

	// 進行中の描画を一時的に描画
	for (const [, strokeData] of otherActiveStrokes.value) {
		ctx.save();
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
		connection.value.send('drawingStroke', {
			points: currentPath,
			tool: currentTool.value,
			color: currentColor.value,
			strokeWidth: strokeWidth.value,
			opacity: currentOpacity.value
		});
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
		connection.value.send('drawingProgress', {
			points: currentPath.slice(), // 現在の描画パスをコピー
			tool: currentTool.value,
			color: currentColor.value,
			strokeWidth: strokeWidth.value,
			opacity: currentOpacity.value,
			isComplete: false
		});
	} catch (error) {
		console.warn('🎨 [WARN] Failed to send drawing progress:', error);
	}
}

// カーソル位置送信
function sendCursorPosition(point: { x: number; y: number }) {
	if (!connection.value) return;

	try {
		connection.value.send('cursorMove', {
			x: point.x,
			y: point.y
		});
	} catch (error) {
		console.warn('🎨 [WARN] Failed to send cursor position:', error);
	}
}

// カーソルタイマー管理
const cursorTimers = new Map<string, ReturnType<typeof setTimeout>>();

// ユーザーごとの色管理
const userCursorColors = new Map<string, string>();

// ユーザーのカーソル色を取得（ランダム生成＆キャッシュ）
function getUserCursorColor(userId: string): string {
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
function getContrastColor(backgroundColor: string): string {
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
	if (data.userId === $i.id) return;

	const index = otherCursors.value.findIndex(c => c.userId === data.userId);
	if (index >= 0) {
		otherCursors.value[index] = {
			userId: data.userId,
			userName: data.userName,
			x: data.x,
			y: data.y
		};
	} else {
		otherCursors.value.push({
			userId: data.userId,
			userName: data.userName,
			x: data.x,
			y: data.y
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
		const response = await fetch(`/api/drawing/save`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${$i.token}`,
			},
			body: JSON.stringify({
				roomId: drawingId.value
			}),
		});

		if (response.ok) {
			// 成功メッセージ表示
			console.log('🎨 [DEBUG] Canvas saved successfully');
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
				text: '入力された値が正しくありません。'
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
			text: 'キャンバスのクリアに失敗しました。'
		});
	}
}

function clearCanvasLocal() {
	if (!ctx) return;
	ctx.clearRect(0, 0, canvasWidth, canvasHeight);
}

// ズームをリセット
function resetZoom() {
	zoomLevel.value = 1;
	panOffset.value = { x: 0, y: 0 };
	zoomCenter.value = { x: 0, y: 0 };
	console.log('🎨 [DEBUG] Zoom reset to 100%');
}

// スクリーン座標をキャンバス座標に変換（ズーム・パン考慮）
function screenToCanvasCoordinates(clientX: number, clientY: number): { x: number; y: number } {
	// キャンバス要素から最新のBoundingRectを取得
	if (!canvasEl.value) return { x: clientX, y: clientY };

	const rect = canvasEl.value.getBoundingClientRect();

	// キャンバス要素の相対座標を取得
	const canvasX = clientX - rect.left;
	const canvasY = clientY - rect.top;

	// CSSのtransformが適用されているため、逆変換を行う
	// transform: translate(panX, panY) scale(zoom)の逆変換
	// 1. パン補正を逆算
	const unPannedX = canvasX - panOffset.value.x;
	const unPannedY = canvasY - panOffset.value.y;

	// 2. スケール補正を逆算
	const unScaledX = unPannedX / zoomLevel.value;
	const unScaledY = unPannedY / zoomLevel.value;

	return { x: unScaledX, y: unScaledY };
}

// キャンバス座標をスクリーン座標に変換（ズーム・パン考慮）
function canvasToScreenCoordinates(canvasX: number, canvasY: number): { x: number; y: number } {
	if (!canvasRect.value) return { x: canvasX, y: canvasY };

	// ズームとパンを適用
	const screenX = (canvasX * zoomLevel.value) + panOffset.value.x + canvasRect.value.left;
	const screenY = (canvasY * zoomLevel.value) + panOffset.value.y + canvasRect.value.top;

	return { x: screenX, y: screenY };
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
		// 2本指の場合: ダブルタップ検出またはパン開始
		isDrawing.value = false; // 描画モードを終了

		const now = Date.now();
		const timeSinceLastTap = now - lastTwoFingerTap.value;

		if (timeSinceLastTap < twoFingerTapTimeout) {
			// ダブルタップ検出: 高度なアンドゥ実行
			console.log('🎨 [DEBUG] Two-finger double tap detected, performing advanced undo');
			performAdvancedUndo();
			lastTwoFingerTap.value = 0; // リセット
			return;
		}

		// 2本指ジェスチャー開始
		lastTwoFingerTap.value = now;
		isPanning.value = true;
		isZooming.value = false;
		gestureState.value = 'none';

		const touch1 = e.touches[0];
		const touch2 = e.touches[1];
		const centerX = (touch1.clientX + touch2.clientX) / 2;
		const centerY = (touch1.clientY + touch2.clientY) / 2;

		panStart.value = { x: centerX, y: centerY };
		zoomCenter.value = { x: centerX, y: centerY };

		// 初期距離を記録
		const dx = touch1.clientX - touch2.clientX;
		const dy = touch1.clientY - touch2.clientY;
		const distance = Math.sqrt(dx * dx + dy * dy);

		lastTouchDistance.value = distance;
		initialDistance.value = distance;
		distanceHistory.value = [distance];

		console.log('🎨 [DEBUG] Two-finger gesture started, initial distance:', Math.round(distance));
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
				console.log('🎨 [DEBUG] Zoom gesture detected');
			} else if (panDistance > panThreshold) {
				gestureState.value = 'pan';
				console.log('🎨 [DEBUG] Pan gesture detected');
			}
		}

		// ズーム処理
		if (gestureState.value === 'zoom' || gestureState.value === 'hybrid') {
			const zoomFactor = avgDistance / lastTouchDistance.value;
			const newZoom = Math.max(minZoom, Math.min(maxZoom, zoomLevel.value * zoomFactor));

			if (Math.abs(newZoom - zoomLevel.value) > 0.01) {
				zoomLevel.value = newZoom;
				console.log('🎨 [DEBUG] Zoom level:', Math.round(newZoom * 100) + '%');
			}
		}

		// パン処理
		if (gestureState.value === 'pan' || gestureState.value === 'hybrid') {
			if (Math.abs(panDeltaX) > 1 || Math.abs(panDeltaY) > 1) {
				requestAnimationFrame(() => {
					panOffset.value = {
						x: panOffset.value.x + panDeltaX,
						y: panOffset.value.y + panDeltaY
					};
				});
			}
		}

		// ハイブリッド状態の判定（パンとズームが同時に発生）
		if (gestureState.value === 'zoom' && panDistance > panThreshold * 2) {
			gestureState.value = 'hybrid';
			console.log('🎨 [DEBUG] Hybrid gesture (pan + zoom)');
		} else if (gestureState.value === 'pan' && distanceFromInitial > zoomThreshold * 0.5) {
			gestureState.value = 'hybrid';
			console.log('🎨 [DEBUG] Hybrid gesture (zoom + pan)');
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
		isPanning.value = false;
		isZooming.value = false;
		gestureState.value = 'none';
		distanceHistory.value = [];
		console.log('🎨 [DEBUG] All gestures ended');
		stopDrawing();
	} else if (e.touches.length === 1 && isPanning.value) {
		// 2本指から1本指になった場合
		isPanning.value = false;
		isZooming.value = false;
		gestureState.value = 'none';
		distanceHistory.value = [];
		console.log('🎨 [DEBUG] Switched from gesture to drawing');
		// 残った1本指で描画を開始
		startDrawing(e);
	}
}

// パフォーマンス監視
function monitorPerformance() {
	const stats = {
		strokeCount: strokeHistory.value.length,
		canvasSize: `${canvasWidth}x${canvasHeight}`,
		memoryUsage: (performance as any).memory ? {
			used: Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024),
			total: Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024),
			limit: Math.round((performance as any).memory.jsHeapSizeLimit / 1024 / 1024)
		} : 'N/A',
		timestamp: new Date().toISOString()
	};

	console.log('🎨 [PERFORMANCE]', stats);

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

	console.log(`🎨 [DEBUG] Handling remote undo for user ${data.userId}`);

	// リモートユーザーのアンドゥの場合、サーバーから最新データを再取得
	loadCanvasData();
}

// キャンバスデータ読み込み
async function loadCanvasData() {
	try {
		const response = await fetch(`/api/drawing/canvas`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${$i.token}`,
			},
			body: JSON.stringify({
				roomId: drawingId.value
			}),
		});

		if (response.ok) {
			const strokes = await response.json();
			console.log(`🎨 [DEBUG] Loaded ${strokes.length} strokes for canvas`);

			// 既存のストロークを復元
			for (const stroke of strokes) {
				drawRemoteStroke(stroke);
			}
		}
	} catch (error) {
		console.warn('🎨 [WARN] Failed to load canvas data:', error);
	}
}

// ストローク履歴管理
function addStrokeToHistory(strokeData: any) {
	strokeHistory.value.push(strokeData);

	// アンドゥ履歴の制限
	if (strokeHistory.value.length > maxUndoHistory) {
		// 古いストロークを削除し、必要に応じてラスタライズ
		const oldStrokesToRemove = strokeHistory.value.length - maxUndoHistory;
		strokeHistory.value.splice(0, oldStrokesToRemove);

		console.log(`🎨 [DEBUG] Undo history limited to ${maxUndoHistory} strokes`);
	}

	// ラスタライズの判定
	if (strokeHistory.value.length >= rasterizeThreshold) {
		performRasterization();
	}
}

// ラスタライズ実行
function performRasterization() {
	if (!ctx || !canvasEl.value) return;

	console.log(`🎨 [DEBUG] Performing rasterization with ${strokeHistory.value.length} strokes`);

	try {
		// 現在のキャンバス内容を画像として保存
		const imageData = canvasEl.value.toDataURL();

		// キャンバスをクリアして再描画
		ctx.clearRect(0, 0, canvasWidth, canvasHeight);

		// 保存した画像を背景として描画
		const img = new Image();
		img.onload = () => {
			ctx!.drawImage(img, 0, 0);
			console.log(`🎨 [DEBUG] Canvas rasterized successfully`);
		};
		img.src = imageData;

		// ストローク履歴をクリア（ラスタライズ後は元に戻せない）
		strokeHistory.value = [];

		// サーバーに通知（他のユーザーとの同期用）
		if (connection.value) {
			try {
				connection.value.send('canvasRasterized', {
					imageData: imageData,
					timestamp: Date.now()
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
	console.log(`🎨 [DEBUG] Undoing stroke: ${removedStroke?.tool} at ${new Date(removedStroke?.timestamp).toISOString()}`);

	// キャンバスを再描画
	redrawCanvasFromHistory();

	// サーバーに通知
	if (connection.value) {
		try {
			connection.value.send('undoStroke', {
				userId: $i.id,
				timestamp: Date.now(),
				strokeId: removedStroke?.timestamp
			});
		} catch (error) {
			console.warn('🎨 [WARN] Failed to send undo notification:', error);
		}
	}
}

// 履歴からキャンバスを再描画
function redrawCanvasFromHistory() {
	if (!ctx) return;

	// キャンバスをクリア
	ctx.clearRect(0, 0, canvasWidth, canvasHeight);

	// 履歴からすべてのストロークを再描画
	for (const stroke of strokeHistory.value) {
		// 高品質な滑らかな描画で再描画
		drawSmoothPath(
			stroke.points,
			stroke.strokeWidth,
			stroke.color,
			stroke.opacity,
			stroke.tool === 'eraser'
		);
	}
}

// チャットオーバーレイ表示
function showChatOverlay(message: any) {
	if (message.fromUserId === $i.id) return;

	chatOverlay.value = {
		user: message.fromUser,
		text: message.text
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
	const aspectRatio = canvasWidth / canvasHeight;
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
	height: 100vh;
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
	background: #ffffff;
	padding: 16px;
	touch-action: none; /* ネイティブタッチ操作を無効化 */
}

.canvas {
	border: 1px solid var(--MI_THEME-divider);
	cursor: crosshair;
	touch-action: none;
	max-width: 100%;
	max-height: 100%;
	border-radius: 8px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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

@container (max-width: 500px) {
	.mouseCorrectionGroup {
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
}
</style>