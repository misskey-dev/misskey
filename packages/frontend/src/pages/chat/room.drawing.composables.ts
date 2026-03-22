/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ref } from 'vue';
import type { Ref } from 'vue';
import type { ToolType, Point, PressurePoint, StrokeData, CommunicationLog } from './room.drawing.types.js';

/**
 * 描画関連のComposable
 */
export function useDrawing() {
	const isDrawing = ref(false);
	const currentPath = ref<PressurePoint[]>([]);

	return {
		isDrawing,
		currentPath,
	};
}

/**
 * WebSocket通信関連のComposable
 */
export function useDrawingConnection(connection: Ref<any>, communicationLog: Ref<CommunicationLog[]>) {
	const MAX_COMM_LOG_ENTRIES = 100;

	function recordCommLog(direction: 'send' | 'receive', type: string, data: any) {
		communicationLog.value.push({
			timestamp: Date.now(),
			direction,
			type,
			data,
		});

		if (communicationLog.value.length > MAX_COMM_LOG_ENTRIES) {
			communicationLog.value.shift();
		}
	}

	function sendDrawingStroke(strokeData: StrokeData) {
		if (!connection.value) return;

		try {
			connection.value.send('drawingStroke', strokeData);
			recordCommLog('send', 'drawingStroke', strokeData);
		} catch (error) {
			console.warn('🎨 [WARN] Failed to send drawing stroke:', error);
		}
	}

	function sendDrawingProgress(progressData: Partial<StrokeData>) {
		if (!connection.value) return;

		try {
			connection.value.send('drawingProgress', progressData);
			recordCommLog('send', 'drawingProgress', progressData);
		} catch (error) {
			console.warn('🎨 [WARN] Failed to send drawing progress:', error);
		}
	}

	function sendCursorPosition(point: Point) {
		if (!connection.value) return;

		try {
			const data = { x: point.x, y: point.y };
			connection.value.send('cursorMove', data);
			recordCommLog('send', 'cursorMove', data);
		} catch (error) {
			console.warn('🎨 [WARN] Failed to send cursor position:', error);
		}
	}

	function sendClearCanvas(userId: string) {
		if (!connection.value) return;

		try {
			const data = { userId, timestamp: Date.now() };
			connection.value.send('clearCanvas', data);
			recordCommLog('send', 'clearCanvas', data);
		} catch (error) {
			console.warn('🎨 [WARN] Failed to send clear canvas:', error);
		}
	}

	function sendUndoStroke(userId: string) {
		if (!connection.value) return;

		try {
			const data = { userId, timestamp: Date.now() };
			connection.value.send('undoStroke', data);
			recordCommLog('send', 'undoStroke', data);
		} catch (error) {
			console.warn('🎨 [WARN] Failed to send undo stroke:', error);
		}
	}

	return {
		recordCommLog,
		sendDrawingStroke,
		sendDrawingProgress,
		sendCursorPosition,
		sendClearCanvas,
		sendUndoStroke,
	};
}

/**
 * キャンバス操作関連のComposable
 */
export function useCanvasOperations(
	ctx: Ref<CanvasRenderingContext2D | null>,
	canvasWidth: Ref<number>,
	canvasHeight: Ref<number>
) {
	function clearCanvas() {
		if (!ctx.value) return;
		ctx.value.clearRect(0, 0, canvasWidth.value, canvasHeight.value);
	}

	function fillCanvas(color: string) {
		if (!ctx.value) return;
		ctx.value.fillStyle = color;
		ctx.value.fillRect(0, 0, canvasWidth.value, canvasHeight.value);
	}

	function getPixelColor(x: number, y: number): string {
		if (!ctx.value) return '#000000';

		const imageData = ctx.value.getImageData(x, y, 1, 1);
		const data = imageData.data;
		const r = data[0];
		const g = data[1];
		const b = data[2];

		return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
	}

	return {
		clearCanvas,
		fillCanvas,
		getPixelColor,
	};
}

/**
 * ズーム・パン操作のComposable
 */
export function useZoomPan() {
	const zoomLevel = ref(1);
	const panOffset = ref<Point>({ x: 0, y: 0 });
	const isPanning = ref(false);
	const isZooming = ref(false);
	const zoomCenter = ref<Point>({ x: 0, y: 0 });

	const minZoom = 0.5;
	const maxZoom = 3.0;

	function resetZoom() {
		zoomLevel.value = 1;
		panOffset.value = { x: 0, y: 0 };
	}

	function zoomIn() {
		zoomLevel.value = Math.min(maxZoom, zoomLevel.value * 1.2);
	}

	function zoomOut() {
		zoomLevel.value = Math.max(minZoom, zoomLevel.value / 1.2);
	}

	function setZoom(level: number) {
		zoomLevel.value = Math.max(minZoom, Math.min(maxZoom, level));
	}

	function setPan(offset: Point) {
		panOffset.value = offset;
	}

	return {
		zoomLevel,
		panOffset,
		isPanning,
		isZooming,
		zoomCenter,
		resetZoom,
		zoomIn,
		zoomOut,
		setZoom,
		setPan,
	};
}

/**
 * アンドゥ・リドゥ操作のComposable
 */
export function useUndoRedo() {
	const strokeHistory = ref<any[]>([]);
	const undoneStrokes = ref<any[]>([]);
	const canUndo = ref(false);
	const canRedo = ref(false);

	function addStrokeToHistory(stroke: any) {
		strokeHistory.value.push(stroke);
		undoneStrokes.value = [];
		updateUndoRedoState();
	}

	function undo() {
		if (strokeHistory.value.length === 0) return null;

		const lastStroke = strokeHistory.value.pop();
		if (lastStroke) {
			undoneStrokes.value.push(lastStroke);
		}
		updateUndoRedoState();
		return lastStroke;
	}

	function redo() {
		if (undoneStrokes.value.length === 0) return null;

		const stroke = undoneStrokes.value.pop();
		if (stroke) {
			strokeHistory.value.push(stroke);
		}
		updateUndoRedoState();
		return stroke;
	}

	function clearHistory() {
		strokeHistory.value = [];
		undoneStrokes.value = [];
		updateUndoRedoState();
	}

	function updateUndoRedoState() {
		canUndo.value = strokeHistory.value.length > 0;
		canRedo.value = undoneStrokes.value.length > 0;
	}

	return {
		strokeHistory,
		undoneStrokes,
		canUndo,
		canRedo,
		addStrokeToHistory,
		undo,
		redo,
		clearHistory,
	};
}

/**
 * ユーティリティ関数のComposable
 */
export function useDrawingUtils() {
	function formatTime(timestamp: number): string {
		const date = new Date(timestamp);
		return date.toLocaleTimeString('ja-JP', {
			hour12: false,
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			fractionalSecondDigits: 3,
		});
	}

	function formatLogData(data: any): string {
		if (typeof data === 'object') {
			if (Array.isArray(data)) {
				return `Array(${data.length})`;
			} else {
				return JSON.stringify(data, null, 2);
			}
		}
		return String(data);
	}

	function simplifyPath(points: PressurePoint[], tolerance: number = 1.0): PressurePoint[] {
		if (points.length <= 2) return points;

		const simplified: PressurePoint[] = [points[0]];

		for (let i = 1; i < points.length - 1; i++) {
			const prev = points[i - 1];
			const curr = points[i];
			const next = points[i + 1];

			const dx1 = curr.x - prev.x;
			const dy1 = curr.y - prev.y;
			const dx2 = next.x - curr.x;
			const dy2 = next.y - curr.y;

			const distance = Math.sqrt(dx1 * dx1 + dy1 * dy1);

			if (distance > tolerance) {
				simplified.push(curr);
			}
		}

		simplified.push(points[points.length - 1]);

		return simplified;
	}

	function smoothPoints(points: PressurePoint[], windowSize: number = 3): PressurePoint[] {
		if (points.length <= windowSize) return points;

		const smoothed: PressurePoint[] = [];
		const halfWindow = Math.floor(windowSize / 2);

		for (let i = 0; i < points.length; i++) {
			let sumX = 0;
			let sumY = 0;
			let sumPressure = 0;
			let count = 0;

			for (let j = Math.max(0, i - halfWindow); j <= Math.min(points.length - 1, i + halfWindow); j++) {
				sumX += points[j].x;
				sumY += points[j].y;
				sumPressure += points[j].pressure;
				count++;
			}

			smoothed.push({
				x: sumX / count,
				y: sumY / count,
				pressure: sumPressure / count,
			});
		}

		return smoothed;
	}

	return {
		formatTime,
		formatLogData,
		simplifyPath,
		smoothPoints,
	};
}

/**
 * ツール状態管理のComposable
 */
export function useToolState() {
	const currentTool = ref<ToolType>('pen');
	const currentColor = ref('#000000');
	const currentOpacity = ref(1);
	const strokeWidth = ref(2);
	const currentLayer = ref(0);

	const toolStrokeWidths = ref({
		pen: 2,
		eraser: 10,
	});

	function setTool(tool: ToolType) {
		if (tool === currentTool.value) return;

		if (currentTool.value === 'pen' || currentTool.value === 'eraser') {
			toolStrokeWidths.value[currentTool.value] = strokeWidth.value;
		}

		currentTool.value = tool;

		if (tool === 'pen' || tool === 'eraser') {
			strokeWidth.value = toolStrokeWidths.value[tool];
		}
	}

	function setColor(color: string) {
		currentColor.value = color;
		if (currentTool.value !== 'pen') {
			currentTool.value = 'pen';
		}
	}

	function setOpacity(opacity: number) {
		currentOpacity.value = opacity;
	}

	function setStrokeWidth(width: number) {
		strokeWidth.value = width;
		if (currentTool.value === 'pen' || currentTool.value === 'eraser') {
			toolStrokeWidths.value[currentTool.value] = width;
		}
	}

	function setLayer(layer: number) {
		currentLayer.value = layer;
	}

	return {
		currentTool,
		currentColor,
		currentOpacity,
		strokeWidth,
		currentLayer,
		toolStrokeWidths,
		setTool,
		setColor,
		setOpacity,
		setStrokeWidth,
		setLayer,
	};
}
