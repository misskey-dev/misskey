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
 * スクリーン座標をキャンバス座標に変換（アスペクト比対応版）
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

	// 要素の境界取得（CSS transform適用後）
	const rect = canvasEl.getBoundingClientRect();

	// 1. スクリーン座標をキャンバス要素内の相対位置に変換
	const elementX = clientX - rect.left;
	const elementY = clientY - rect.top;

	// 2. displayWidth/displayHeightベースで計算（transformを考慮しない論理サイズ）
	// CSS transformが適用されているため、実際の表示サイズではなく論理サイズを使用
	const logicalWidth = displayWidth;
	const logicalHeight = displayHeight;

	// 3. rectはtransform後のサイズなので、transform前のサイズを計算
	// transform: translate(pan) scale(zoom) が適用されている
	const transformedWidth = rect.width;
	const transformedHeight = rect.height;

	// 4. 要素内座標を0-1の正規化座標に変換
	const normalizedX = elementX / transformedWidth;
	const normalizedY = elementY / transformedHeight;

	// 5. transform-originを考慮した逆変換
	// transform-origin: center の場合、中心を基準にスケールされる
	const originX = isTouchDevice ? zoomCenter.x : logicalWidth / 2;
	const originY = isTouchDevice ? zoomCenter.y : logicalHeight / 2;

	// 6. 正規化座標をtransform適用後のサイズで変換
	// getBoundingRect()はtransform適用後の座標なので、まずそこに戻す
	const transformedX = normalizedX * transformedWidth;
	const transformedY = normalizedY * transformedHeight;

	// 7. CSS transform逆変換
	// CSS: transform: translate(panX, panY) scale(zoom)
	// CSSは右から左に適用される: 実際の適用順は scale → translate
	// 逆変換は適用の逆順: translate逆変換 → scale逆変換

	// まず、transform-originを考慮してtransform中心を計算
	// transform-originは論理サイズ（displayWidth/Height）ベース
	const transformOriginX = isTouchDevice ? (zoomCenter.x / logicalWidth) * transformedWidth : transformedWidth / 2;
	const transformOriginY = isTouchDevice ? (zoomCenter.y / logicalHeight) * transformedHeight : transformedHeight / 2;

	// translate逆変換: パンオフセットを打ち消す
	// パンオフセットはscale適用後に加算されているので、現在のスケールで調整
	const afterUntranslateX = transformedX - (panOffset.x * zoomLevel);
	const afterUntranslateY = transformedY - (panOffset.y * zoomLevel);

	// scale逆変換: transform-originを基準にスケールを戻す
	const fromOriginX = afterUntranslateX - transformOriginX;
	const fromOriginY = afterUntranslateY - transformOriginY;
	const unscaledX = fromOriginX / zoomLevel + transformOriginX;
	const unscaledY = fromOriginY / zoomLevel + transformOriginY;

	// 8. 論理表示サイズにスケーリング
	const displayX = (unscaledX / transformedWidth) * logicalWidth;
	const displayY = (unscaledY / transformedHeight) * logicalHeight;

	// 9. 論理キャンバス座標に変換
	const scale = logicalWidth / canvasWidth;
	let logicalX = displayX / scale;
	let logicalY = displayY / scale;

	// 10. 詳細なサイズ情報を取得（デバッグ用）
	const physicalWidth = canvasEl.width;
	const physicalHeight = canvasEl.height;
	const cssWidth = parseFloat(canvasEl.style.width || '0');
	const cssHeight = parseFloat(canvasEl.style.height || '0');
	const actualDisplayWidth = rect.width;
	const actualDisplayHeight = rect.height;
	const dpr = window.devicePixelRatio || 1;

	// 11. 最終座標を論理キャンバス範囲内にクランプ
	const beforeClampX = logicalX;
	const beforeClampY = logicalY;
	logicalX = Math.max(0, Math.min(canvasWidth, logicalX));
	logicalY = Math.max(0, Math.min(canvasHeight, logicalY));

	// デバッグ情報を更新（新しい計算方法対応）
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
				displaySize: `${logicalWidth}×${logicalHeight}`,
			},
			input: {
				screen: `(${clientX.toFixed(1)}, ${clientY.toFixed(1)})`,
				element: `(${elementX.toFixed(1)}, ${elementY.toFixed(1)})`,
				normalized: `(${normalizedX.toFixed(3)}, ${normalizedY.toFixed(3)})`,
				display: `(${displayX.toFixed(1)}, ${displayY.toFixed(1)})`,
				afterUntranslate: `(${afterUntranslateX.toFixed(1)}, ${afterUntranslateY.toFixed(1)})`,
			},
			scales: {
				scale: scale.toFixed(3),
				transformedSize: `${transformedWidth.toFixed(1)}×${transformedHeight.toFixed(1)}`,
				aspectRatio: `${canvasWidth}:${canvasHeight}`,
			},
			transform: {
				panOffset: `(${panOffset.x.toFixed(1)}, ${panOffset.y.toFixed(1)})`,
				zoomLevel: `${zoomLevel.toFixed(2)}x`,
				zoomCenter: `(${zoomCenter.x.toFixed(1)}, ${zoomCenter.y.toFixed(1)})`,
				origin: `(${originX.toFixed(1)}, ${originY.toFixed(1)})`,
				unscaled: `(${unscaledX.toFixed(1)}, ${unscaledY.toFixed(1)})`,
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
