/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Ref } from 'vue';
import type { PressurePoint, Point, ToolType } from './room.drawing.types.js';

// イベントハンドラー用のComposable
export function useDrawingHandlers(deps: {
	ctx: Ref<CanvasRenderingContext2D | null>;
	canvasEl: Ref<HTMLCanvasElement | undefined>;
	isDrawing: Ref<boolean>;
	currentPath: Ref<PressurePoint[]>;
	currentTool: Ref<ToolType>;
	currentColor: Ref<string>;
	strokeWidth: Ref<number>;
	currentOpacity: Ref<number>;
	isSpaceKeyPressed: Ref<boolean>;
	isPanningWithSpace: Ref<boolean>;
	panStart: Ref<Point>;
	panOffset: Ref<Point>;
	getEventPoint: (event: MouseEvent | TouchEvent) => Point;
	calculatePressure: () => number;
	recordTraceLog: (type: string, screenX: number, screenY: number, canvasX: number, canvasY: number) => void;
	eyedropColor: (point: Point) => void;
	drawLine: (point: Point) => void;
	sendCursorPosition: (point: Point) => void;
	sendDrawingProgress: () => void;
	sendDrawingStroke: () => void;
	addStrokeToHistory: (strokeData: any) => void;
	lastTime: { value: number };
	velocityHistory: number[];
	pointBuffer: any[];
}) {
	function startDrawing(event: MouseEvent | TouchEvent) {
		if (!deps.ctx.value) return;

		// スペースキーが押されている場合はパンモード
		if (deps.isSpaceKeyPressed.value && event instanceof MouseEvent) {
			deps.isPanningWithSpace.value = true;
			deps.panStart.value = { x: event.clientX, y: event.clientY };
			if (deps.canvasEl.value) {
				deps.canvasEl.value.style.cursor = 'grabbing';
			}
			return;
		}

		deps.isDrawing.value = true;

		// マウス補正状態をリセット
		deps.lastTime.value = 0;
		deps.velocityHistory.length = 0;
		deps.pointBuffer.length = 0;

		const point = deps.getEventPoint(event);
		const pressure = deps.calculatePressure(); // 初期筆圧を計算
		const pressurePoint: PressurePoint = { x: point.x, y: point.y, pressure };
		deps.currentPath.value = [pressurePoint];

		// 軌跡ログを記録
		let clientX: number, clientY: number;
		if (event instanceof MouseEvent) {
			clientX = event.clientX;
			clientY = event.clientY;
			deps.recordTraceLog('mousedown', clientX, clientY, point.x, point.y);
		} else if (event.touches.length > 0) {
			clientX = event.touches[0].clientX;
			clientY = event.touches[0].clientY;
			deps.recordTraceLog('touchstart', clientX, clientY, point.x, point.y);
		}

		if (deps.currentTool.value === 'eyedropper') {
			deps.eyedropColor(point);
			return;
		}

		// 描画開始点を設定
		deps.ctx.value.beginPath();
		deps.ctx.value.moveTo(point.x, point.y);
	}

	function draw(event: MouseEvent | TouchEvent) {
		if (!deps.ctx.value) return;

		// スペースキーでのパン中
		if (deps.isPanningWithSpace.value && event instanceof MouseEvent) {
			const deltaX = event.clientX - deps.panStart.value.x;
			const deltaY = event.clientY - deps.panStart.value.y;

			deps.panOffset.value = {
				x: deps.panOffset.value.x + deltaX,
				y: deps.panOffset.value.y + deltaY
			};

			deps.panStart.value = { x: event.clientX, y: event.clientY };
			return;
		}

		const point = deps.getEventPoint(event);

		// 軌跡ログを記録
		let clientX: number, clientY: number;
		if (event instanceof MouseEvent) {
			clientX = event.clientX;
			clientY = event.clientY;
			if (deps.isDrawing.value) {
				deps.recordTraceLog('mousemove', clientX, clientY, point.x, point.y);
			}
		} else if (event.touches.length > 0) {
			clientX = event.touches[0].clientX;
			clientY = event.touches[0].clientY;
			if (deps.isDrawing.value) {
				deps.recordTraceLog('touchmove', clientX, clientY, point.x, point.y);
			}
		}

		// カーソル位置を他のユーザーに送信
		deps.sendCursorPosition(point);

		if (!deps.isDrawing.value || deps.currentTool.value === 'eyedropper') return;

		const pressure = deps.calculatePressure(); // 現在の筆圧を計算
		const pressurePoint: PressurePoint = { x: point.x, y: point.y, pressure };
		deps.currentPath.value.push(pressurePoint);

		// ローカル描画
		deps.drawLine(point);

		// リアルタイム描画進行状況を他のユーザーに送信
		deps.sendDrawingProgress();
	}

	function stopDrawing() {
		// スペースキーでのパン終了
		if (deps.isPanningWithSpace.value) {
			deps.isPanningWithSpace.value = false;
			if (deps.canvasEl.value && deps.isSpaceKeyPressed.value) {
				deps.canvasEl.value.style.cursor = 'grab';
			} else if (deps.canvasEl.value) {
				deps.canvasEl.value.style.cursor = 'crosshair';
			}
			return;
		}

		if (!deps.isDrawing.value || deps.currentPath.value.length === 0) return;

		deps.isDrawing.value = false;

		// ストローク履歴に追加
		const strokeData = {
			points: [...deps.currentPath.value],
			tool: deps.currentTool.value,
			color: deps.currentColor.value,
			strokeWidth: deps.strokeWidth.value,
			opacity: deps.currentOpacity.value,
			timestamp: Date.now()
		};

		deps.addStrokeToHistory(strokeData);

		// 描画データを他のユーザーに送信
		deps.sendDrawingStroke();
		deps.currentPath.value = [];
	}

	return {
		startDrawing,
		draw,
		stopDrawing
	};
}
