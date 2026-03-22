/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Ref } from 'vue';
import type { PressurePoint, Point, ToolType } from './room.drawing.types.js';

// WebSocket通信用のComposable
export function useDrawingNetwork(deps: {
	connection: Ref<any>;
	currentPath: Ref<PressurePoint[]>;
	currentTool: Ref<ToolType>;
	currentColor: Ref<string>;
	strokeWidth: Ref<number>;
	currentOpacity: Ref<number>;
	currentLayer: Ref<number>;
	otherCursors: Ref<any[]>;
	$i: any;
	recordCommLog: (direction: 'send' | 'receive', type: string, data: any) => void;
	lastProgressSent: { value: number };
	progressSendInterval: number;
}) {
	// カーソルタイマー管理
	const cursorTimers = new Map<string, number>();

	// ユーザーごとの色管理
	const userCursorColors = new Map<string, string>();

	function sendDrawingStroke() {
		if (deps.currentPath.value.length === 0 || !deps.connection.value) return;

		try {
			const data = {
				points: deps.currentPath.value,
				tool: deps.currentTool.value,
				color: deps.currentColor.value,
				strokeWidth: deps.strokeWidth.value,
				opacity: deps.currentOpacity.value,
				layer: deps.currentLayer.value
			};
			deps.connection.value.send('drawingStroke', data);
			deps.recordCommLog('send', 'drawingStroke', data);
		} catch (error) {
			console.warn('🎨 [WARN] Failed to send drawing stroke:', error);
		}
	}

	function sendDrawingProgress() {
		if (deps.currentPath.value.length === 0 || !deps.connection.value) return;

		const now = Date.now();
		if (now - deps.lastProgressSent.value < deps.progressSendInterval) return;
		deps.lastProgressSent.value = now;

		try {
			const data = {
				points: deps.currentPath.value.slice(),
				tool: deps.currentTool.value,
				color: deps.currentColor.value,
				strokeWidth: deps.strokeWidth.value,
				opacity: deps.currentOpacity.value,
				isComplete: false,
				layer: deps.currentLayer.value
			};
			deps.connection.value.send('drawingProgress', data);
			deps.recordCommLog('send', 'drawingProgress', data);
		} catch (error) {
			console.warn('🎨 [WARN] Failed to send drawing progress:', error);
		}
	}

	function sendCursorPosition(point: Point) {
		if (!deps.connection.value) return;

		try {
			const data = {
				x: point.x,
				y: point.y
			};
			deps.connection.value.send('cursorMove', data);
			deps.recordCommLog('send', 'cursorMove', data);
		} catch (error) {
			console.warn('🎨 [WARN] Failed to send cursor position:', error);
		}
	}

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

	function getContrastColor(backgroundColor: string): string {
		// HSL色をRGBに変換して明度を判定
		const hslMatch = backgroundColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
		if (hslMatch) {
			const lightness = parseInt(hslMatch[3]);
			return lightness > 55 ? '#000000' : '#ffffff';
		}
		return '#ffffff'; // デフォルトは白
	}

	function updateOtherCursor(data: any) {
		if (data.userId === deps.$i.id) return;

		const index = deps.otherCursors.value.findIndex(c => c.userId === data.userId);
		if (index >= 0) {
			deps.otherCursors.value[index] = {
				userId: data.userId,
				userName: data.userName,
				x: data.x,
				y: data.y,
				color: getUserCursorColor(data.userId)
			};
		} else {
			deps.otherCursors.value.push({
				userId: data.userId,
				userName: data.userName,
				x: data.x,
				y: data.y,
				color: getUserCursorColor(data.userId)
			});
		}

		// 既存のタイマーをクリア
		if (cursorTimers.has(data.userId)) {
			window.clearTimeout(cursorTimers.get(data.userId));
		}

		// 3秒後にカーソルを削除
		const timer = window.setTimeout(() => {
			const idx = deps.otherCursors.value.findIndex(c => c.userId === data.userId);
			if (idx >= 0) {
				deps.otherCursors.value.splice(idx, 1);
			}
			cursorTimers.delete(data.userId);
		}, 3000);

		cursorTimers.set(data.userId, timer);
	}

	function sendUndo() {
		if (!deps.connection.value) return;

		try {
			const data = {
				layer: deps.currentLayer.value
			};
			deps.connection.value.send('undo', data);
			deps.recordCommLog('send', 'undo', data);
		} catch (error) {
			console.warn('🎨 [WARN] Failed to send undo:', error);
		}
	}

	function sendRedo() {
		if (!deps.connection.value) return;

		try {
			const data = {
				layer: deps.currentLayer.value
			};
			deps.connection.value.send('redo', data);
			deps.recordCommLog('send', 'redo', data);
		} catch (error) {
			console.warn('🎨 [WARN] Failed to send redo:', error);
		}
	}

	function sendClearCanvas() {
		if (!deps.connection.value) return;

		try {
			const data = {
				layer: deps.currentLayer.value
			};
			deps.connection.value.send('clearCanvas', data);
			deps.recordCommLog('send', 'clearCanvas', data);
		} catch (error) {
			console.warn('🎨 [WARN] Failed to send clear canvas:', error);
		}
	}

	return {
		sendDrawingStroke,
		sendDrawingProgress,
		sendCursorPosition,
		getUserCursorColor,
		getContrastColor,
		updateOtherCursor,
		sendUndo,
		sendRedo,
		sendClearCanvas
	};
}
