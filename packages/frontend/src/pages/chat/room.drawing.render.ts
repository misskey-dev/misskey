/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Ref } from 'vue';
import type { PressurePoint, Point, ToolType } from './room.drawing.types.js';

// 描画処理用のComposable
export function useDrawingRender(deps: {
	ctx: Ref<CanvasRenderingContext2D | null>;
	canvasWidth: Ref<number>;
	canvasHeight: Ref<number>;
	currentPath: Ref<PressurePoint[]>;
	currentTool: Ref<ToolType>;
	currentColor: Ref<string>;
	strokeWidth: Ref<number>;
	currentOpacity: Ref<number>;
	otherActiveStrokes: Ref<Map<string, any>>;
	$i: any;
	calculatePressure: () => number;
	simplifyPath: (points: Point[], tolerance: number) => Point[];
	smoothPoints: (points: Point[], windowSize: number) => Point[];
	addStrokeToHistory: (strokeData: any) => void;
}) {
	function drawSmoothPath(
		points: Array<{ x: number; y: number; pressure?: number }>,
		strokeWidth?: number,
		color?: string,
		opacity?: number,
		isEraser: boolean = false
	) {
		if (!deps.ctx.value || points.length < 2) return;

		deps.ctx.value.save();

		// パラメータが指定された場合は描画設定を更新
		const baseStrokeWidth = strokeWidth !== undefined ? strokeWidth : deps.ctx.value.lineWidth;
		if (color !== undefined) {
			deps.ctx.value.strokeStyle = color;
		}
		if (opacity !== undefined) {
			deps.ctx.value.globalAlpha = opacity;
		}

		deps.ctx.value.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
		deps.ctx.value.lineCap = 'round';
		deps.ctx.value.lineJoin = 'round';
		deps.ctx.value.imageSmoothingEnabled = true;
		deps.ctx.value.imageSmoothingQuality = 'high';

		// 筆圧情報があるかチェック
		const hasPressure = points.some(p => p.pressure !== undefined);

		if (hasPressure) {
			// 筆圧対応：各セグメントごとに描画
			for (let i = 0; i < points.length - 1; i++) {
				const p1 = points[i];
				const p2 = points[i + 1];
				const pressure = p2.pressure || 1.0;

				deps.ctx.value.lineWidth = baseStrokeWidth * pressure;
				deps.ctx.value.beginPath();
				deps.ctx.value.moveTo(p1.x, p1.y);
				deps.ctx.value.lineTo(p2.x, p2.y);
				deps.ctx.value.stroke();
			}
		} else {
			// 筆圧なし：従来の描画
			deps.ctx.value.lineWidth = baseStrokeWidth;

			// 1. 移動平均によるスムージング
			let processedPoints = deps.smoothPoints(points, 3);

			// 2. ダグラス・ピューカー法による最適化（点が多い場合のみ）
			if (processedPoints.length > 4) {
				processedPoints = deps.simplifyPath(processedPoints, 0.5);
			}

			// 3. 高品質ベジェ曲線描画
			deps.ctx.value.beginPath();
			deps.ctx.value.moveTo(processedPoints[0].x, processedPoints[0].y);

			if (processedPoints.length === 2) {
				deps.ctx.value.lineTo(processedPoints[1].x, processedPoints[1].y);
			} else if (processedPoints.length === 3) {
				// 3点の場合は2次ベジェ曲線
				const cp = {
					x: (processedPoints[0].x + processedPoints[2].x) / 2,
					y: (processedPoints[0].y + processedPoints[2].y) / 2
				};
				deps.ctx.value.quadraticCurveTo(processedPoints[1].x, processedPoints[1].y, cp.x, cp.y);
				deps.ctx.value.lineTo(processedPoints[2].x, processedPoints[2].y);
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
					deps.ctx.value.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
				}
			}

			deps.ctx.value.stroke();
		}

		deps.ctx.value.restore();
	}

	function drawLine(point: Point) {
		if (!deps.ctx.value) return;

		// 筆圧シミュレーション適用
		const pressure = deps.calculatePressure();
		const dynamicStrokeWidth = deps.strokeWidth.value * pressure;

		// リアルタイム描画：軽量な線描画
		deps.ctx.value.save();
		deps.ctx.value.globalCompositeOperation = deps.currentTool.value === 'eraser' ? 'destination-out' : 'source-over';
		deps.ctx.value.strokeStyle = deps.currentColor.value;
		deps.ctx.value.globalAlpha = deps.currentOpacity.value;
		deps.ctx.value.lineWidth = dynamicStrokeWidth;
		deps.ctx.value.lineCap = 'round';
		deps.ctx.value.lineJoin = 'round';
		deps.ctx.value.imageSmoothingEnabled = true;
		deps.ctx.value.imageSmoothingQuality = 'high';

		if (deps.currentPath.value.length === 1) {
			// 単一点の場合は小さな円を描画
			deps.ctx.value.beginPath();
			deps.ctx.value.arc(point.x, point.y, dynamicStrokeWidth / 2, 0, Math.PI * 2);
			deps.ctx.value.fill();
		} else if (deps.currentPath.value.length >= 2) {
			// 線描画
			const prevPoint = deps.currentPath.value[deps.currentPath.value.length - 2];
			deps.ctx.value.beginPath();
			deps.ctx.value.moveTo(prevPoint.x, prevPoint.y);
			deps.ctx.value.lineTo(point.x, point.y);
			deps.ctx.value.stroke();
		}

		deps.ctx.value.restore();
	}

	function drawRemoteStroke(data: any) {
		if (!deps.ctx.value || data.userId === deps.$i.id) return;

		deps.ctx.value.save();
		deps.ctx.value.globalCompositeOperation = data.tool === 'eraser' ? 'destination-out' : 'source-over';
		deps.ctx.value.strokeStyle = data.color;
		deps.ctx.value.globalAlpha = data.opacity;
		deps.ctx.value.lineWidth = data.strokeWidth;
		deps.ctx.value.lineCap = 'round';
		deps.ctx.value.lineJoin = 'round';

		// 最高品質な滑らかな描画を適用
		drawSmoothPath(
			data.points,
			data.strokeWidth,
			data.color,
			data.opacity,
			data.tool === 'eraser'
		);

		deps.ctx.value.restore();

		// 進行中の描画があれば完了として削除
		if (deps.otherActiveStrokes.value.has(data.userId)) {
			deps.otherActiveStrokes.value.delete(data.userId);
		}

		// リモートストロークも履歴に追加（自動ラスタライズ管理用）
		deps.addStrokeToHistory({
			points: data.points,
			tool: data.tool,
			color: data.color,
			strokeWidth: data.strokeWidth,
			opacity: data.opacity,
			timestamp: Date.now(),
			remote: true // リモートストロークフラグ
		});
	}

	function drawRemoteProgress(data: any) {
		if (!deps.ctx.value || data.userId === deps.$i.id) return;

		console.log('🎨 [DEBUG] Drawing remote progress from user:', data.userId, 'points:', data.points.length);

		// 進行中の描画を更新
		deps.otherActiveStrokes.value.set(data.userId, {
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

	function redrawWithActiveStrokes() {
		if (!deps.ctx.value) return;

		// 現在のキャンバス状態を保存
		const imageData = deps.ctx.value.getImageData(0, 0, deps.canvasWidth.value, deps.canvasHeight.value);

		// 進行中の描画を一時的に描画
		for (const [, strokeData] of deps.otherActiveStrokes.value) {
			deps.ctx.value.save();
			deps.ctx.value.globalCompositeOperation = strokeData.tool === 'eraser' ? 'destination-out' : 'source-over';
			deps.ctx.value.strokeStyle = strokeData.color;
			deps.ctx.value.globalAlpha = strokeData.opacity * 0.8; // 進行中は少し薄く
			deps.ctx.value.lineWidth = strokeData.strokeWidth;
			deps.ctx.value.lineCap = 'round';
			deps.ctx.value.lineJoin = 'round';

			// 進行中の描画を表示
			if (strokeData.points && strokeData.points.length > 0) {
				drawSmoothPath(
					strokeData.points,
					strokeData.strokeWidth,
					strokeData.color,
					strokeData.opacity * 0.8,
					strokeData.tool === 'eraser'
				);
			}

			deps.ctx.value.restore();
		}
	}

	return {
		drawSmoothPath,
		drawLine,
		drawRemoteStroke,
		drawRemoteProgress,
		redrawWithActiveStrokes
	};
}
