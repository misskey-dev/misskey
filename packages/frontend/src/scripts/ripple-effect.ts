/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { defineEffectLayer, createCubicBezier } from '@/scripts/effect-layer.js';

const easeRadius = createCubicBezier(0.165, 0.84, 0.44, 1);
const easeStroke = createCubicBezier(0.3, 0.61, 0.355, 1);
const easeParticlePositon = createCubicBezier(0.3, 0.61, 0.355, 1);

type Particle = {
	size: number;
	xA: number;
	yA: number;
	xB: number;
	yB: number;
	color: string;
};

// しきい値
const rippleDuration = 500;
const rippleStartRadius = 4;
const rippleEndRadius = 32;
const rippleStartStrokeWidth = 16;
const particleDuration = 800;

export const launchRipple = defineEffectLayer((ctx, x: number, y: number) => {
	// 初回フレームで中央座標とパーティクルを初期化
	if (ctx.isFirstFrame) {
		const colors = ['#FF1493', '#00FFFF', '#FFE202'];
		const particles: Particle[] = [];
		for (let i = 0; i < 12; i++) {
			const angle = Math.random() * Math.PI * 2;
			const pos = Math.random() * 16;
			const velocity = 16 + Math.random() * 48;
			particles.push({
				size: 4 + Math.random() * 8,
				xA: Math.sin(angle) * pos,
				yA: Math.cos(angle) * pos,
				xB: Math.sin(angle) * (pos + velocity),
				yB: Math.cos(angle) * (pos + velocity),
				color: colors[Math.floor(Math.random() * colors.length)]
			});
		}

		ctx.saveStore({
			particles,
			accentColor: getComputedStyle(document.documentElement).getPropertyValue('--MI_THEME-accent') || '#000',
		});
	}

	const { particles, accentColor } = ctx.store as { particles: Particle[], accentColor: string };
	const elapsed = ctx.timestamp - ctx.firstFrameAt;
	const canvasCtx = ctx.ctx;

	// リプル円の描画（0.5秒間）
	if (elapsed <= rippleDuration) {
		const rawProgress = Math.min(elapsed / rippleDuration, 1);
		const radiusProgress = easeRadius(rawProgress);
		const strokeProgress = easeStroke(rawProgress);

		const radius = rippleStartRadius + (rippleEndRadius - rippleStartRadius) * radiusProgress;
		const strokeWidth = rippleStartStrokeWidth * (1 - strokeProgress);

		canvasCtx.save();
		canvasCtx.beginPath();
		canvasCtx.arc(x, y, radius, 0, Math.PI * 2);
		canvasCtx.lineWidth = strokeWidth;
		canvasCtx.strokeStyle = accentColor;
		canvasCtx.stroke();
		canvasCtx.restore();
	}

	// パーティクルの描画（0.8秒間）
	if (elapsed <= particleDuration && particles) {
		particles.forEach(particle => {
			const parProgress = Math.min(elapsed / particleDuration, 1);
			const posProgress = easeParticlePositon(parProgress);
			const radiusProgress = easeRadius(parProgress);

			const px = x + particle.xA + (particle.xB - particle.xA) * posProgress;
			const py = y + particle.yA + (particle.yB - particle.yA) * posProgress;
			const pradius = particle.size * (1 - radiusProgress);

			canvasCtx.save();
			canvasCtx.beginPath();
			canvasCtx.arc(px, py, pradius, 0, Math.PI * 2);
			canvasCtx.fillStyle = particle.color;
			canvasCtx.strokeStyle = accentColor;
			canvasCtx.lineWidth = 2;
			canvasCtx.stroke();
			canvasCtx.fill();
			canvasCtx.restore();
		});
	}

	// エフェクト終了処理（1.1秒経過で終了）
	if (elapsed >= 1100) {
		ctx.done();
	}
}, 1200);
