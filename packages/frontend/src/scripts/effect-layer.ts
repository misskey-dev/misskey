/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type EffectLayerFunctionContext<S extends EffectStore> = {
	ctx: CanvasRenderingContext2D;
	width: number;
	height: number;
	timestamp: number;
	isFirstFrame: boolean;
	firstFrameAt: number;
	store: S;
	saveStore: (store: S) => void;
	done: () => void;
};

type EffectStore = Record<string, any>;

type EffectLayer<S extends EffectStore> = {
	id: number;
	firstFrameAt: number | null;
	store: S;
	fn: (context: EffectLayerFunctionContext<S>) => void;
};

type AdditionalArgs<F> = F extends (context: EffectLayerFunctionContext<EffectStore>, ...args: infer A) => void ? A : never;

let effectLayerIdCount = 0;
const effects: EffectLayer<EffectStore>[] = [];

export function defineEffectLayer<S extends EffectStore, F extends (context: EffectLayerFunctionContext<S>, ...args: any) => void>(fn: F, forceDisposeTime?: number) {
	return function (...args: AdditionalArgs<F>) {
		const id = effectLayerIdCount++;
		effects.push({
			id,
			firstFrameAt: null,
			store: {} as S,
			fn: (context: EffectLayerFunctionContext<EffectStore>) => fn(context as EffectLayerFunctionContext<S>, ...args),
		});

		if (forceDisposeTime != null) {
			setTimeout(() => {
				effects.splice(effects.findIndex(effect => effect.id === id), 1);
			}, forceDisposeTime);
		}

		return id;
	}
}

// cubic-bezierのy座標を返す関数を生成（CSSのcubic-bezier()と互換）
export function createCubicBezier(_p1x: number, p1y: number, _p2x: number, p2y: number) {
	const cY = 3 * p1y;
	const bY = 3 * (p2y - p1y) - cY;
	const aY = 1 - cY - bY;
	return (t: number) => {
		if (t < 0 || t > 1) {
			throw new Error('t must be between 0 and 1');
		}

		return ((aY * t + bY) * t + cY) * t;
	};
}

export function attachEffectLayer(el: HTMLCanvasElement) {
	const ctx = el.getContext('2d')!;

	function tick(timestamp: DOMHighResTimeStamp) {
		el.width = window.innerWidth;
		el.height = window.innerHeight;

		const width = el.width;
		const height = el.height;

		ctx.clearRect(0, 0, el.width, el.height);

		for (const effect of effects) {
			effect.fn({
				ctx,
				width,
				height,
				timestamp,
				isFirstFrame: effect.firstFrameAt === null,
				firstFrameAt: effect.firstFrameAt ?? timestamp,
				store: effect.store,
				saveStore: (store) => {
					effect.store = store;
				},
				done: () => {
					effects.splice(effects.findIndex(eff => eff.id === effect.id), 1);
				}
			});

			if (effect.firstFrameAt === null) {
				effect.firstFrameAt = timestamp;
			}
		}

		requestAnimationFrame(tick);
	}

	requestAnimationFrame(tick);
}
