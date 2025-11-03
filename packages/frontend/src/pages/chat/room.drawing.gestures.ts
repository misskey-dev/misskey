/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ref, type Ref } from 'vue';
import type { Point, GestureState } from './room.drawing.types.js';

/**
 * タッチジェスチャー管理のComposable
 */
export function useGestures() {
	const gestureState = ref<GestureState>('none');
	const initialDistance = ref(0);
	const distanceHistory = ref<number[]>([]);
	const lastTouchDistance = ref(0);
	const lastTwoFingerTap = ref(0);
	const panStart = ref<Point>({ x: 0, y: 0 });

	const panThreshold = 5; // パン開始の最小移動距離
	const zoomThreshold = 15; // ズーム開始の最小距離変化
	const twoFingerTapTimeout = 300; // ダブルタップの間隔（ms）

	function calculateDistance(touch1: Touch, touch2: Touch): number {
		const dx = touch1.clientX - touch2.clientX;
		const dy = touch1.clientY - touch2.clientY;
		return Math.sqrt(dx * dx + dy * dy);
	}

	function calculateCenter(touch1: Touch, touch2: Touch): Point {
		return {
			x: (touch1.clientX + touch2.clientX) / 2,
			y: (touch1.clientY + touch2.clientY) / 2,
		};
	}

	function initTwoFingerGesture(touch1: Touch, touch2: Touch): { center: Point; distance: number } {
		const center = calculateCenter(touch1, touch2);
		const distance = calculateDistance(touch1, touch2);

		panStart.value = center;
		lastTouchDistance.value = distance;
		initialDistance.value = distance;
		distanceHistory.value = [distance];
		gestureState.value = 'none';

		return { center, distance };
	}

	function updateGestureState(currentDistance: number, panDelta: Point): GestureState {
		const avgDistance = distanceHistory.value.reduce((a, b) => a + b, 0) / distanceHistory.value.length;
		const distanceFromInitial = Math.abs(avgDistance - initialDistance.value);
		const panDistance = Math.sqrt(panDelta.x * panDelta.x + panDelta.y * panDelta.y);

		if (gestureState.value === 'none') {
			if (distanceFromInitial > zoomThreshold) {
				gestureState.value = 'zoom';
			} else if (panDistance > panThreshold) {
				gestureState.value = 'pan';
			}
		}

		// ハイブリッド状態の判定
		if (gestureState.value === 'zoom' && panDistance > panThreshold * 2) {
			gestureState.value = 'hybrid';
		} else if (gestureState.value === 'pan' && distanceFromInitial > zoomThreshold * 0.5) {
			gestureState.value = 'hybrid';
		}

		return gestureState.value;
	}

	function addDistanceToHistory(distance: number) {
		distanceHistory.value.push(distance);
		if (distanceHistory.value.length > 5) {
			distanceHistory.value.shift();
		}
	}

	function getAverageDistance(): number {
		return distanceHistory.value.reduce((a, b) => a + b, 0) / distanceHistory.value.length;
	}

	function checkTwoFingerDoubleTap(): boolean {
		const now = Date.now();
		const timeSinceLastTap = now - lastTwoFingerTap.value;

		if (timeSinceLastTap < twoFingerTapTimeout) {
			lastTwoFingerTap.value = 0;
			return true;
		}

		lastTwoFingerTap.value = now;
		return false;
	}

	function resetGesture() {
		gestureState.value = 'none';
		distanceHistory.value = [];
		initialDistance.value = 0;
	}

	return {
		gestureState,
		initialDistance,
		distanceHistory,
		lastTouchDistance,
		lastTwoFingerTap,
		panStart,
		panThreshold,
		zoomThreshold,
		calculateDistance,
		calculateCenter,
		initTwoFingerGesture,
		updateGestureState,
		addDistanceToHistory,
		getAverageDistance,
		checkTwoFingerDoubleTap,
		resetGesture,
	};
}

/**
 * キーボードイベント管理のComposable
 */
export function useKeyboard() {
	const isSpaceKeyPressed = ref(false);
	const isPanningWithSpace = ref(false);

	function handleKeyDown(e: KeyboardEvent, callbacks: {
		undo?: () => void;
		redo?: () => void;
		zoomIn?: () => void;
		zoomOut?: () => void;
		resetZoom?: () => void;
		setPen?: () => void;
		setEraser?: () => void;
		setEyedropper?: () => void;
		startSpacePan?: () => void;
	}) {
		// Space キー: パン開始
		if (e.code === 'Space' && !isSpaceKeyPressed.value) {
			e.preventDefault();
			isSpaceKeyPressed.value = true;
			if (callbacks.startSpacePan) {
				callbacks.startSpacePan();
			}
		}
		// Ctrl/Cmd + Z: アンドゥ
		else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
			e.preventDefault();
			if (callbacks.undo) {
				callbacks.undo();
			}
		}
		// Ctrl/Cmd + Y または Ctrl/Cmd + Shift + Z: リドゥ
		else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
			e.preventDefault();
			if (callbacks.redo) {
				callbacks.redo();
			}
		}
		// +: ズームイン
		else if ((e.key === '+' || e.key === '=') && (e.ctrlKey || e.metaKey)) {
			e.preventDefault();
			if (callbacks.zoomIn) {
				callbacks.zoomIn();
			}
		}
		// -: ズームアウト
		else if (e.key === '-' && (e.ctrlKey || e.metaKey)) {
			e.preventDefault();
			if (callbacks.zoomOut) {
				callbacks.zoomOut();
			}
		}
		// 0: ズームリセット
		else if (e.key === '0' && (e.ctrlKey || e.metaKey)) {
			e.preventDefault();
			if (callbacks.resetZoom) {
				callbacks.resetZoom();
			}
		}
		// P: ペンツール
		else if (e.key === 'p' || e.key === 'P') {
			e.preventDefault();
			if (callbacks.setPen) {
				callbacks.setPen();
			}
		}
		// E: 消しゴムツール
		else if (e.key === 'e' || e.key === 'E') {
			e.preventDefault();
			if (callbacks.setEraser) {
				callbacks.setEraser();
			}
		}
		// I: スポイトツール
		else if (e.key === 'i' || e.key === 'I') {
			e.preventDefault();
			if (callbacks.setEyedropper) {
				callbacks.setEyedropper();
			}
		}
	}

	function handleKeyUp(e: KeyboardEvent, callbacks: {
		endSpacePan?: () => void;
	}) {
		if (e.code === 'Space') {
			isSpaceKeyPressed.value = false;
			isPanningWithSpace.value = false;
			if (callbacks.endSpacePan) {
				callbacks.endSpacePan();
			}
		}
	}

	return {
		isSpaceKeyPressed,
		isPanningWithSpace,
		handleKeyDown,
		handleKeyUp,
	};
}

/**
 * ホイールイベント管理のComposable
 */
export function useWheel() {
	function handleWheel(
		event: WheelEvent,
		currentZoom: number,
		minZoom: number,
		maxZoom: number,
		callbacks: {
			setZoom: (zoom: number) => void;
			updateZoomCenter?: (center: Point) => void;
		}
	) {
		event.preventDefault();

		const delta = event.deltaY;
		const zoomFactor = delta > 0 ? 0.9 : 1.1;
		const newZoom = Math.max(minZoom, Math.min(maxZoom, currentZoom * zoomFactor));

		callbacks.setZoom(newZoom);

		// ズーム中心を更新
		if (callbacks.updateZoomCenter) {
			const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
			const x = event.clientX - rect.left;
			const y = event.clientY - rect.top;
			callbacks.updateZoomCenter({ x, y });
		}
	}

	return {
		handleWheel,
	};
}
