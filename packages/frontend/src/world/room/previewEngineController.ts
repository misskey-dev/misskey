/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { reactive, ref, shallowRef, triggerRef, watch } from 'vue';
import * as BABYLON from '@babylonjs/core';
import { EventEmitter } from 'eventemitter3';
import PreviewEngineWorker from './previewEngineWorker?worker';
import { RoomObjectPreviewEngine } from './previewEngine.js';
import type { ShallowRef } from 'vue';
import type { RoomEngineEvents, RoomState } from './engine.js';
import * as sound from '@/utility/sound.js';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { deepEqual } from '@/utility/deep-equal.js';

export type PreviewEngineControllerOptions = {
	workerMode?: boolean;
	graphicsQuality: number;
	fps: number | null;
	resolution: number;
};

// 抽象化レイヤー
// TODO: 他のcontrollerと共通部分を抽出してabstract classを作ってそこから派生する形にする
export class PreviewEngineController {
	private worker: Worker | null = null;
	private engine: RoomObjectPreviewEngine | null = null;
	private canvas: HTMLCanvasElement | null = null;
	private options: PreviewEngineControllerOptions;
	private returnHooks = new Map<number, (value: any) => void>();
	public isReady = ref(false);
	private pointerDownPosition: { x: number; y: number } | null = null;
	private abortController = new AbortController();

	constructor(options: PreviewEngineControllerOptions) {
		this.options = options;
	}

	public async init(canvas: HTMLCanvasElement) {
		this.canvas = canvas;
		this.canvas.width = canvas.clientWidth;
		this.canvas.height = canvas.clientHeight;

		const engineEvents = new EventEmitter<RoomEngineEvents>();

		if (this.options.workerMode) {
			const offscreen = canvas.transferControlToOffscreen();
			this.worker = new PreviewEngineWorker();
			this.worker.postMessage({ type: 'init', canvas: offscreen, options: this.options }, [offscreen]);
			this.worker.onmessage = (event) => {
				switch (event.data?.type) {
					case 'inited': {
						this.isReady.value = true;
						break;
					}
					case 'ev': {
						const { type, ctx } = event.data.ev;
						engineEvents.emit(type, ctx);
						break;
					}
					case 'return': {
						const { id, value } = event.data;
						const hook = this.returnHooks.get(id);
						if (hook != null) {
							hook(value);
							this.returnHooks.delete(id);
						}
						break;
					}
					default: {
						console.warn('Unrecognized message from worker:', event.data?.type);
					}
				}
			};
		} else {
			const babylonEngine = new BABYLON.WebGPUEngine(canvas, { doNotHandleContextLost: true, powerPreference: 'low-power', antialias: true });
			babylonEngine.compatibilityMode = false;
			babylonEngine.enableOfflineSupport = false;
			babylonEngine.onContextLostObservable.add(() => {
				os.alert({
					type: 'error',
					title: i18n.ts.somethingHappened,
					text: i18n.ts._room.crushed_description,
				});
			});
			await babylonEngine.initAsync();
			if (this.options.resolution === 2) babylonEngine.setHardwareScalingLevel(0.5);
			if (this.options.resolution === 0.5) babylonEngine.setHardwareScalingLevel(2);

			this.engine = new RoomObjectPreviewEngine({
				engine: babylonEngine,
				...this.options,
			});

			this.engine.on('ev', ({ type, ctx }) => {
				engineEvents.emit(type, ctx);
			});

			await this.engine.init();

			this.isReady.value = true;
		}

		this.canvas.addEventListener('wheel', (ev) => {
			if (this.worker != null) {
				this.worker.postMessage({ type: 'input:wheel', ev: { deltaY: ev.deltaY } });
			} else if (this.engine != null) {
				this.engine.inputs.emit('wheel', { deltaY: ev.deltaY });
			}
			ev.preventDefault();
			ev.stopPropagation();
			return false;
		}, { signal: this.abortController.signal });

		const pointerEventCache = new Map<number, PointerEvent>();
		let pointerVec = { x: 0, y: 0 };

		this.canvas.addEventListener('pointerdown', (ev) => {
			ev.preventDefault();
			ev.stopPropagation();
			this.canvas!.focus();
			pointerEventCache.set(ev.pointerId, ev);
			this.canvas!.setPointerCapture(ev.pointerId);

			pointerVec = { x: ev.clientX, y: ev.clientY };

			this.pointerDownPosition = { x: ev.offsetX, y: ev.offsetY };

			return false;
		}, { signal: this.abortController.signal });

		let prevTwoTouchPointsDistance = 0;

		this.canvas!.addEventListener('pointermove', (ev) => {
			ev.preventDefault();
			ev.stopPropagation();

			if (pointerEventCache.size === 0) {
				return;
			}

			pointerEventCache.set(ev.pointerId, ev);

			if (pointerEventCache.size > 1) {
				const a = Array.from(pointerEventCache.values())[0];
				const b = Array.from(pointerEventCache.values())[1];
				const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
				if (prevTwoTouchPointsDistance > 0) {
					const delta = distance - prevTwoTouchPointsDistance;
					if (this.worker != null) {
						this.worker.postMessage({ type: 'input:wheel', ev: { deltaY: -delta * 3 } });
					} else if (this.engine != null) {
						this.engine.inputs.emit('wheel', { deltaY: -delta * 3 });
					}
				}
				prevTwoTouchPointsDistance = distance;

				pointerVec = { x: 0, y: 0 };
				this.setCameraRotateVector({
					x: 0,
					y: 0,
				});
				return;
			}

			prevTwoTouchPointsDistance = 0;

			const before = pointerVec;
			const after = { x: ev.clientX, y: ev.clientY };

			if (pointerVec.x !== 0 || pointerVec.y !== 0) {
				this.setCameraRotateVector({
					x: after.x - before.x,
					y: after.y - before.y,
				});
			}

			pointerVec.x = after.x;
			pointerVec.y = after.y;

			return false;
		}, { signal: this.abortController.signal });

		this.canvas.addEventListener('pointerup', (ev) => {
			pointerEventCache.delete(ev.pointerId);
			this.canvas!.releasePointerCapture(ev.pointerId);

			prevTwoTouchPointsDistance = 0;

			if (pointerEventCache.size > 0) {
				return;
			}

			pointerVec.x = 0;
			pointerVec.y = 0;
			this.setCameraRotateVector(pointerVec);

			if (this.pointerDownPosition != null) {
				const dx = Math.abs(ev.offsetX - this.pointerDownPosition.x);
				const dy = Math.abs(ev.offsetY - this.pointerDownPosition.y);
				if (dx < 10 && dy < 10) {
					const median = { x: (ev.offsetX + this.pointerDownPosition.x) / 2, y: (ev.offsetY + this.pointerDownPosition.y) / 2 };
					if (this.worker != null) {
						this.worker.postMessage({ type: 'input:click', ev: { x: median.x, y: median.y } });
					} else if (this.engine != null) {
						this.engine.inputs.emit('click', { x: median.x, y: median.y });
					}
				}
			}
			this.pointerDownPosition = null;
		}, { signal: this.abortController.signal });
	}

	private callCounter = 0;

	// TODO: いい感じに型付け
	private call(fn, args = [], needReturnValue = false) {
		if (this.worker != null) {
			if (needReturnValue) {
				return new Promise((resolve) => {
					const id = this.callCounter++;
					this.returnHooks.set(id, (value) => {
						resolve(value);
					});
					this.worker!.postMessage({ type: 'call', fn, args, needReturnValue: true, id });
				});
			} else {
				this.worker.postMessage({ type: 'call', fn, args });
			}
		} else if (this.engine != null) {
			return this.engine[fn](...args);
		}
	}

	// TODO: いい感じに型付け
	private set(key, value) {
		if (this.worker != null) {
			this.worker.postMessage({ type: 'set', key, value });
		} else if (this.engine != null) {
			this.engine[key] = value;
		}
	}

	public pauseRender() {
		this.call('pauseRender');
	}

	public resumeRender() {
		this.call('resumeRender');
	}

	public setCameraRotateVector(vec: { x: number; y: number }) {
		this.call('cameraRotate', [vec]);
	}

	public updateObjectOption(key: string, value: any) {
		this.call('updateObjectOption', [key, value]);
	}

	public loadObject(type: string) {
		return this.call('loadObject', [type], true);
	}

	public clearObject() {
		this.call('clearObject');
	}

	public resize() {
		if (this.canvas == null) return;
		const width = this.canvas.clientWidth;
		const height = this.canvas.clientHeight;
		if (this.worker != null) {
			this.worker.postMessage({ type: 'resize', width, height });
		} else if (this.engine != null) {
			this.engine.resize();
		}
	}

	public destroy() {
		this.abortController.abort();

		if (this.worker != null) {
			this.worker.terminate();
			this.worker = null;
		}
		if (this.engine != null) {
			this.engine.destroy();
			this.engine = null;
		}
	}
}
