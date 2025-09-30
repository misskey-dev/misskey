/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Point, PressurePoint } from './room.drawing.types.js';

// 手ブレ補正関数
export function applyHandShakeCorrection(
	rawPoint: Point,
	handShakeEnabled: boolean,
	correctionLevel: number,
	lastTime: { value: number },
	smoothedPoint: { value: Point },
	lastPoint: { value: Point },
	velocityHistory: number[],
	pointBuffer: Array<{ x: number; y: number; timestamp: number }>,
	correctionLevels: Array<{
		level: number;
		smoothingFactor: number;
		minDistance: number;
		velocityWeight: number;
		bufferSize: number;
		adaptiveThreshold: number;
	}>
): Point {
	if (!handShakeEnabled) return rawPoint;

	const currentTime = Date.now();

	// 初回の場合は補正なしで返す
	if (lastTime.value === 0) {
		smoothedPoint.value = rawPoint;
		lastPoint.value = rawPoint;
		lastTime.value = currentTime;
		return rawPoint;
	}

	const deltaTime = currentTime - lastTime.value;
	if (deltaTime === 0) return smoothedPoint.value;

	// 補正レベル設定を取得
	const settings = correctionLevels[Math.min(correctionLevel - 1, correctionLevels.length - 1)];

	// 速度計算
	const deltaX = rawPoint.x - lastPoint.value.x;
	const deltaY = rawPoint.y - lastPoint.value.y;
	const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
	const velocity = distance / deltaTime;

	// 速度履歴を更新
	velocityHistory.push(velocity);
	if (velocityHistory.length > 5) velocityHistory.shift();

	// 平均速度を計算
	const avgVelocity = velocityHistory.reduce((sum, v) => sum + v, 0) / velocityHistory.length;

	// 適応的なスムージング係数
	const adaptiveFactor = Math.min(1, avgVelocity / settings.adaptiveThreshold);
	const smoothingFactor = settings.smoothingFactor * (1 - adaptiveFactor * 0.5);

	// 指数移動平均によるスムージング
	const smoothedX = smoothedPoint.value.x + (rawPoint.x - smoothedPoint.value.x) * smoothingFactor;
	const smoothedY = smoothedPoint.value.y + (rawPoint.y - smoothedPoint.value.y) * smoothingFactor;

	// バッファを使った追加スムージング
	pointBuffer.push({ x: rawPoint.x, y: rawPoint.y, timestamp: currentTime });
	if (pointBuffer.length > settings.bufferSize) pointBuffer.shift();

	let finalX = smoothedX;
	let finalY = smoothedY;

	if (pointBuffer.length >= 3) {
		const recentPoints = pointBuffer.slice(-settings.bufferSize);
		const avgX = recentPoints.reduce((sum, p) => sum + p.x, 0) / recentPoints.length;
		const avgY = recentPoints.reduce((sum, p) => sum + p.y, 0) / recentPoints.length;

		const velocityWeight = settings.velocityWeight * adaptiveFactor;
		finalX = smoothedX * (1 - velocityWeight) + avgX * velocityWeight;
		finalY = smoothedY * (1 - velocityWeight) + avgY * velocityWeight;
	}

	// 最小距離フィルター
	const correctedDistance = Math.sqrt(
		(finalX - lastPoint.value.x) ** 2 + (finalY - lastPoint.value.y) ** 2
	);

	if (correctedDistance < settings.minDistance) {
		return lastPoint.value;
	}

	// 状態を更新
	smoothedPoint.value = { x: finalX, y: finalY };
	lastPoint.value = rawPoint;
	lastTime.value = currentTime;

	return { x: finalX, y: finalY };
}

// 筆圧計算
export function calculatePressure(
	pressureSimulationEnabled: boolean,
	isTouchDevice: boolean,
	velocityHistory: number[]
): number {
	if (!pressureSimulationEnabled) return 1.0;

	if (isTouchDevice) {
		// タッチデバイスでは速度ベースの筆圧シミュレーション
		if (velocityHistory.length === 0) return 0.8;

		const avgVelocity = velocityHistory.reduce((sum, v) => sum + v, 0) / velocityHistory.length;
		const normalizedVelocity = Math.min(1, avgVelocity / 2);
		return Math.max(0.3, 1.0 - normalizedVelocity * 0.5);
	} else {
		// マウスでは固定筆圧
		return 1.0;
	}
}

// ダグラス・ピューカー法による線の簡素化
export function simplifyPath(points: Point[], tolerance: number = 1.0): Point[] {
	if (points.length <= 2) return points;

	function douglasPeucker(pts: Point[], epsilon: number): Point[] {
		if (pts.length <= 2) return pts;

		let maxDistance = 0;
		let maxIndex = 0;

		const first = pts[0];
		const last = pts[pts.length - 1];

		for (let i = 1; i < pts.length - 1; i++) {
			const distance = perpendicularDistance(pts[i], first, last);
			if (distance > maxDistance) {
				maxDistance = distance;
				maxIndex = i;
			}
		}

		if (maxDistance > epsilon) {
			const left = douglasPeucker(pts.slice(0, maxIndex + 1), epsilon);
			const right = douglasPeucker(pts.slice(maxIndex), epsilon);
			return [...left.slice(0, -1), ...right];
		} else {
			return [first, last];
		}
	}

	function perpendicularDistance(point: Point, lineStart: Point, lineEnd: Point): number {
		const dx = lineEnd.x - lineStart.x;
		const dy = lineEnd.y - lineStart.y;

		if (dx === 0 && dy === 0) {
			return Math.sqrt((point.x - lineStart.x) ** 2 + (point.y - lineStart.y) ** 2);
		}

		const t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (dx * dx + dy * dy);
		const clampedT = Math.max(0, Math.min(1, t));

		const closestX = lineStart.x + clampedT * dx;
		const closestY = lineStart.y + clampedT * dy;

		return Math.sqrt((point.x - closestX) ** 2 + (point.y - closestY) ** 2);
	}

	return douglasPeucker(points, tolerance);
}

// 移動平均によるスムージング
export function smoothPoints(points: Point[], windowSize: number = 3): Point[] {
	if (points.length < windowSize) return points;

	const result: Point[] = [];
	const halfWindow = Math.floor(windowSize / 2);

	for (let i = 0; i < points.length; i++) {
		const start = Math.max(0, i - halfWindow);
		const end = Math.min(points.length, i + halfWindow + 1);
		const window = points.slice(start, end);

		const avgX = window.reduce((sum, p) => sum + p.x, 0) / window.length;
		const avgY = window.reduce((sum, p) => sum + p.y, 0) / window.length;

		result.push({ x: avgX, y: avgY });
	}

	return result;
}

// 座標の正確な取得
export function getAccurateCoordinates(
	canvas: HTMLCanvasElement,
	clientX: number,
	clientY: number
): Point {
	const rect = canvas.getBoundingClientRect();
	const scaleX = canvas.width / rect.width;
	const scaleY = canvas.height / rect.height;

	const canvasX = (clientX - rect.left) * scaleX;
	const canvasY = (clientY - rect.top) * scaleY;

	return { x: canvasX, y: canvasY };
}

// 時刻フォーマット
export function formatTime(timestamp: number): string {
	const date = new Date(timestamp);
	return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
}

// ログデータフォーマット
export function formatLogData(data: any): string {
	if (typeof data === 'object') {
		return JSON.stringify(data, null, 2);
	}
	return String(data);
}
