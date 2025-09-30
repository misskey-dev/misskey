/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { PressurePoint, TimedPoint, CorrectionLevel } from './room.drawing.types.js';

/**
 * Canvas描画ユーティリティ
 */

/**
 * 滑らかな線を描画（Catmull-Romスプライン補間）
 */
export function drawSmoothPath(
	ctx: CanvasRenderingContext2D,
	points: PressurePoint[],
	strokeWidth: number,
	color: string,
	opacity: number,
	isEraser: boolean
): void {
	if (points.length === 0) return;

	ctx.save();
	ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
	ctx.strokeStyle = color;
	ctx.globalAlpha = opacity;
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';
	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = 'high';

	if (points.length === 1) {
		// 1点だけの場合は円を描画
		ctx.beginPath();
		const point = points[0];
		const radius = (strokeWidth * point.pressure) / 2;
		ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
		ctx.fill();
	} else if (points.length === 2) {
		// 2点の場合は直線
		ctx.beginPath();
		ctx.lineWidth = strokeWidth * points[0].pressure;
		ctx.moveTo(points[0].x, points[0].y);
		ctx.lineTo(points[1].x, points[1].y);
		ctx.stroke();
	} else {
		// 3点以上の場合はCatmull-Romスプライン補間
		for (let i = 0; i < points.length - 1; i++) {
			const p0 = points[Math.max(0, i - 1)];
			const p1 = points[i];
			const p2 = points[i + 1];
			const p3 = points[Math.min(points.length - 1, i + 2)];

			const avgPressure = (p1.pressure + p2.pressure) / 2;
			ctx.lineWidth = strokeWidth * avgPressure;

			ctx.beginPath();
			ctx.moveTo(p1.x, p1.y);

			// Catmull-Romスプライン曲線を生成
			const segments = 10;
			for (let t = 0; t <= segments; t++) {
				const s = t / segments;
				const s2 = s * s;
				const s3 = s2 * s;

				// Catmull-Rom基底関数
				const h1 = -0.5 * s3 + s2 - 0.5 * s;
				const h2 = 1.5 * s3 - 2.5 * s2 + 1;
				const h3 = -1.5 * s3 + 2 * s2 + 0.5 * s;
				const h4 = 0.5 * s3 - 0.5 * s2;

				const x = h1 * p0.x + h2 * p1.x + h3 * p2.x + h4 * p3.x;
				const y = h1 * p0.y + h2 * p1.y + h3 * p2.y + h4 * p3.y;

				ctx.lineTo(x, y);
			}

			ctx.stroke();
		}
	}

	ctx.restore();
}

/**
 * 手ブレ補正を適用した点を計算
 */
export function applyHandShakeCorrection(
	currentPoint: PressurePoint,
	smoothedPoint: { x: number; y: number },
	lastPoint: { x: number; y: number },
	velocity: number,
	velocityHistory: number[],
	pointBuffer: TimedPoint[],
	correctionSettings: CorrectionLevel,
	isEnabled: boolean
): {
	correctedPoint: PressurePoint;
	newSmoothedPoint: { x: number; y: number };
	newVelocity: number;
} {
	if (!isEnabled) {
		return {
			correctedPoint: currentPoint,
			newSmoothedPoint: currentPoint,
			newVelocity: velocity,
		};
	}

	const now = Date.now();
	const { factor, minDistance, velocitySmoothing } = correctionSettings;

	// 点をバッファに追加
	pointBuffer.push({ x: currentPoint.x, y: currentPoint.y, time: now });
	if (pointBuffer.length > 5) {
		pointBuffer.shift();
	}

	// 速度を計算（最新の2点間）
	if (pointBuffer.length >= 2) {
		const prev = pointBuffer[pointBuffer.length - 2];
		const current = pointBuffer[pointBuffer.length - 1];
		const dx = current.x - prev.x;
		const dy = current.y - prev.y;
		const distance = Math.sqrt(dx * dx + dy * dy);
		const dt = Math.max(1, current.time - prev.time);
		const newVelocity = distance / dt * 1000; // px/s

		// 速度履歴を管理
		velocityHistory.push(newVelocity);
		if (velocityHistory.length > 5) {
			velocityHistory.shift();
		}

		// 平均速度を計算
		velocity = velocityHistory.reduce((a, b) => a + b, 0) / velocityHistory.length;
	}

	// 速度に応じた補正係数（速いほど補正を弱く）
	const velocityFactor = Math.min(1, velocity / 500); // 500px/s以上で最大
	const adaptiveFactor = factor * (1 - velocityFactor * 0.3);

	// 指数移動平均でスムージング
	smoothedPoint.x = smoothedPoint.x * adaptiveFactor + currentPoint.x * (1 - adaptiveFactor);
	smoothedPoint.y = smoothedPoint.y * adaptiveFactor + currentPoint.y * (1 - adaptiveFactor);

	// 最小移動距離チェック（細かい揺れを除去）
	const dx = smoothedPoint.x - lastPoint.x;
	const dy = smoothedPoint.y - lastPoint.y;
	const distance = Math.sqrt(dx * dx + dy * dy);

	if (distance < minDistance) {
		// 最小距離未満の場合は前の点を返す
		return {
			correctedPoint: { x: lastPoint.x, y: lastPoint.y, pressure: currentPoint.pressure },
			newSmoothedPoint: smoothedPoint,
			newVelocity: velocity,
		};
	}

	return {
		correctedPoint: { x: smoothedPoint.x, y: smoothedPoint.y, pressure: currentPoint.pressure },
		newSmoothedPoint: smoothedPoint,
		newVelocity: velocity,
	};
}

/**
 * 筆圧シミュレーション（速度ベース）
 */
export function simulatePressureFromVelocity(velocity: number, baseStrokeWidth: number): number {
	// 速度が遅いほど太く、速いほど細く
	const minPressure = 0.3;
	const maxPressure = 1.0;
	const velocityThreshold = 1000; // 1000px/s で最小筆圧

	const pressureFactor = Math.max(0, 1 - velocity / velocityThreshold);
	return minPressure + (maxPressure - minPressure) * pressureFactor;
}

/**
 * ユーザーのカーソル色を生成（ユーザーIDベース）
 */
export function getUserCursorColor(userId: string): string {
	// ユーザーIDをベースにした一意で鮮やかな色を生成
	const hue = (userId.charCodeAt(0) + userId.charCodeAt(userId.length - 1)) % 360;
	const saturation = 70 + (userId.length % 30); // 70-100%
	const lightness = 45 + (userId.charCodeAt(1) % 20); // 45-65%
	return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * 背景色に対する適切なコントラスト色を計算
 */
export function getContrastColor(backgroundColor: string): string {
	// HSL色をRGBに変換して明度を判定
	const hslMatch = backgroundColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
	if (hslMatch) {
		const lightness = parseInt(hslMatch[3]);
		return lightness > 55 ? '#000000' : '#ffffff';
	}
	return '#ffffff'; // デフォルトは白
}
