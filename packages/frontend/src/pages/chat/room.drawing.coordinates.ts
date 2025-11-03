/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Ref } from 'vue';
import type { Point, DebugInfo } from './room.drawing.types.js';

/**
 * 座標変換ユーティリティ
 */

/**
 * 実際の描画可能領域を計算
 */
export function getActualDrawingArea(
	canvasEl: HTMLCanvasElement | null,
	canvasWidth: number,
	canvasHeight: number
): { x: number; y: number; width: number; height: number; scale: number } {
	if (!canvasEl) return { x: 0, y: 0, width: 800, height: 600, scale: 1 };

	const rect = canvasEl.getBoundingClientRect();
	const containerWidth = rect.width;
	const containerHeight = rect.height;

	// 論理キャンバスの縦横比
	const canvasAspect = canvasWidth / canvasHeight;
	const containerAspect = containerWidth / containerHeight;

	let actualWidth: number;
	let actualHeight: number;
	let offsetX: number;
	let offsetY: number;
	let scale: number;

	if (containerAspect > canvasAspect) {
		// コンテナが横長の場合、高さに合わせる
		actualHeight = containerHeight;
		actualWidth = actualHeight * canvasAspect;
		offsetX = (containerWidth - actualWidth) / 2;
		offsetY = 0;
		scale = actualHeight / canvasHeight;
	} else {
		// コンテナが縦長の場合、幅に合わせる
		actualWidth = containerWidth;
		actualHeight = actualWidth / canvasAspect;
		offsetX = 0;
		offsetY = (containerHeight - actualHeight) / 2;
		scale = actualWidth / canvasWidth;
	}

	return {
		x: offsetX,
		y: offsetY,
		width: actualWidth,
		height: actualHeight,
		scale: scale,
	};
}

/**
 * スクリーン座標をキャンバス座標に変換（親要素遡及方式）
 *
 * この関数は、ブラウザウィンドウ全体でのマウス/タッチ座標（clientX, clientY）を、
 * キャンバス上の論理座標に変換します。
 *
 * アプローチ:
 * 1. canvas要素からページトップまでの累積オフセットを計算
 * 2. スクリーン座標からオフセットを引いて、canvas要素内での相対座標を取得
 * 3. CSS transform (zoom/pan) を逆適用
 * 4. 論理キャンバス座標に変換
 */
export function screenToCanvasCoordinates(
	clientX: number,
	clientY: number,
	canvasEl: HTMLCanvasElement | null,
	canvasWidth: number,
	canvasHeight: number,
	displayWidth: number,
	displayHeight: number,
	panOffset: Point,
	zoomLevel: number,
	zoomCenter: Point,
	isTouchDevice: boolean,
	debugInfo?: Ref<DebugInfo>
): Point {
	if (!canvasEl) return { x: clientX, y: clientY };

	// 1. canvas要素の境界を取得（getBoundingClientRectはCSS transform適用後の座標を返す）
	const canvasRect = canvasEl.getBoundingClientRect();

	// 2. スクリーン座標からcanvas要素の左上を引いて、canvas要素内の相対座標を取得
	const canvasRelativeX = clientX - canvasRect.left;
	const canvasRelativeY = clientY - canvasRect.top;

	// 3. CSS transformの逆適用
	// transform: translate(panOffset.x, panOffset.y) scale(zoomLevel)
	// transformOrigin: zoomCenter (モバイル) or center (PC)

	// まず、現在のtransform後のサイズを取得
	const transformedWidth = canvasRect.width;
	const transformedHeight = canvasRect.height;

	// 正規化座標（0-1）に変換
	// transformedWidth/Height = displayWidth/Height × zoomLevel
	const normalizedX = canvasRelativeX / transformedWidth;
	const normalizedY = canvasRelativeY / transformedHeight;

	// 論理キャンバス座標に直接変換
	// normalizedX × canvasWidth = (canvasRelativeX / (displayWidth × zoom)) × canvasWidth
	// displayWidth = canvasWidth の場合、これは canvasRelativeX / zoom と同じ
	// つまり、zoom の逆変換が自動的に行われる
	// pan の影響は、rect.left/top がすでに translate(pan) を含んでいるため、
	// canvasRelativeX = clientX - rect.left の時点で自動的に除去されている
	let logicalX = normalizedX * canvasWidth;
	let logicalY = normalizedY * canvasHeight;

	// 5. 詳細なサイズ情報を取得（デバッグ用）
	const physicalWidth = canvasEl.width;
	const physicalHeight = canvasEl.height;
	const cssWidth = parseFloat(canvasEl.style.width || '0');
	const cssHeight = parseFloat(canvasEl.style.height || '0');
	const actualDisplayWidth = canvasRect.width;
	const actualDisplayHeight = canvasRect.height;
	const dpr = window.devicePixelRatio || 1;

	// 6. 最終座標を論理キャンバス範囲内にクランプ
	const beforeClampX = logicalX;
	const beforeClampY = logicalY;
	logicalX = Math.max(0, Math.min(canvasWidth, logicalX));
	logicalY = Math.max(0, Math.min(canvasHeight, logicalY));

	// 詳細なデバッグログを出力
	console.log('🎯 [座標変換デバッグ] ==========================================');
	console.log('📍 入力座標 (clientX/Y):', {
		clientX: clientX.toFixed(1),
		clientY: clientY.toFixed(1),
	});
	console.log('🖼️ Canvas Rect (getBoundingClientRect):', {
		left: canvasRect.left.toFixed(1),
		top: canvasRect.top.toFixed(1),
		width: canvasRect.width.toFixed(1),
		height: canvasRect.height.toFixed(1),
		説明: `transform適用後のサイズ = displaySize × zoom`,
	});
	console.log('📊 Canvas相対座標:', {
		canvasRelativeX: canvasRelativeX.toFixed(1),
		canvasRelativeY: canvasRelativeY.toFixed(1),
		計算式: `client - rect.left/top`,
		説明: `panの影響は自動除去済み`,
	});
	console.log('🔢 正規化座標 (0-1):', {
		normalizedX: normalizedX.toFixed(4),
		normalizedY: normalizedY.toFixed(4),
		計算式: `canvasRelative / transformedSize`,
	});
	console.log('✅ 最終論理座標:', {
		beforeClamp: `(${beforeClampX.toFixed(1)}, ${beforeClampY.toFixed(1)})`,
		afterClamp: `(${logicalX.toFixed(1)}, ${logicalY.toFixed(1)})`,
		計算式: `normalized × canvasSize`,
		説明: `zoomの逆変換は自動適用済み`,
	});
	console.log('🔧 Transform状態:', {
		zoomLevel: zoomLevel.toFixed(3) + 'x',
		panOffset: `(${panOffset.x.toFixed(1)}, ${panOffset.y.toFixed(1)})`,
		canvasSize: `${canvasWidth}×${canvasHeight}`,
		displaySize: `${displayWidth}×${displayHeight}`,
		transformedSize: `${transformedWidth.toFixed(1)}×${transformedHeight.toFixed(1)}`,
	});
	console.log('===========================================================');

	// デバッグ情報を更新
	if (debugInfo) {
		debugInfo.value = {
			device: {
				devicePixelRatio: dpr.toFixed(2),
				userAgent: navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop',
				touchDevice: isTouchDevice ? 'Yes' : 'No',
			},
			sizes: {
				physical: `${physicalWidth}×${physicalHeight}`,
				cssStyle: `${cssWidth.toFixed(1)}×${cssHeight.toFixed(1)}`,
				actualDisplay: `${actualDisplayWidth.toFixed(1)}×${actualDisplayHeight.toFixed(1)}`,
				logical: `${canvasWidth}×${canvasHeight}`,
				displaySize: `${displayWidth}×${displayHeight}`,
			},
			input: {
				screen: `(${clientX.toFixed(1)}, ${clientY.toFixed(1)})`,
				canvasRelative: `(${canvasRelativeX.toFixed(1)}, ${canvasRelativeY.toFixed(1)})`,
				normalized: `(${normalizedX.toFixed(3)}, ${normalizedY.toFixed(3)})`,
			},
			scales: {
				transformedSize: `${transformedWidth.toFixed(1)}×${transformedHeight.toFixed(1)}`,
				aspectRatio: `${canvasWidth}:${canvasHeight}`,
				zoomLevel: zoomLevel.toFixed(3),
			},
			transform: {
				panOffset: `(${panOffset.x.toFixed(1)}, ${panOffset.y.toFixed(1)})`,
				zoomLevel: `${zoomLevel.toFixed(2)}x`,
				zoomCenter: `(${zoomCenter.x.toFixed(1)}, ${zoomCenter.y.toFixed(1)})`,
			},
			final: {
				coordinates: `(${Math.round(logicalX)}, ${Math.round(logicalY)})`,
				beforeClamp: `(${beforeClampX.toFixed(1)}, ${beforeClampY.toFixed(1)})`,
				afterClamp: `(${logicalX.toFixed(1)}, ${logicalY.toFixed(1)})`,
			},
			lastUpdate: new Date().toLocaleTimeString(),
		};
	}

	return {
		x: Math.round(logicalX * 10) / 10,
		y: Math.round(logicalY * 10) / 10,
	};
}
