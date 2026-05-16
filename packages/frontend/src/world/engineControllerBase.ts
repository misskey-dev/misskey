/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { reactive, ref, shallowRef, triggerRef, watch } from 'vue';
import * as BABYLON from '@babylonjs/core';
import { EventEmitter } from 'eventemitter3';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';

export type EngineControllerBaseOptions = {
	workerMode?: boolean;
	graphicsQuality: number;
	fps: number | null;
	resolution: number;
	antialias: boolean;
};

// UIとエンジンの間に挟まり抽象化を行うレイヤー。
// UIからは、エンジンが直で動いててもワーカーで動いてても同じように操作できるように見える
export abstract class EngineControllerBase<T extends RoomEngineBase> {
	private worker: Worker | null = null;
	private engine: T | null = null;
	private canvas: HTMLCanvasElement | null = null;
	protected options: EngineControllerBaseOptions;
	private returnHooks = new Map<number, (value: any) => void>();
	public isReady = ref(false);
	public initializeProgress = ref(0);
	private pointerDownPosition: { x: number; y: number } | null = null;
	private abortController = new AbortController();

	constructor(options: EngineControllerBaseOptions) {
		this.options = options;
	}

	protected async _init_(canvas: HTMLCanvasElement, params: {
		createWorker: (offscreen: OffscreenCanvas) => Promise<Worker>;
		createEngine: (babylonEngine: BABYLON.WebGPUEngine) => Promise<T>;
	}) {
		this.canvas = canvas;

		// 最低でも4pxないとなんかエラーになる
		this.canvas.width = canvas.clientWidth > 4 ? canvas.clientWidth : 4;
		this.canvas.height = canvas.clientHeight > 4 ? canvas.clientHeight : 4;

		const engineEvents = new EventEmitter<RoomEngineBaseEvents>();

		engineEvents.on('loadingProgress', ({ progress }) => {
			this.initializeProgress.value = progress;
		});

		if (this.options.workerMode) {
			const offscreen = canvas.transferControlToOffscreen();
			this.worker = await params.createWorker(offscreen);
			this.worker.onmessage = (event) => {
				switch (event.data?.type) {
					case 'inited': {
						this.initializeProgress.value = 1;
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
					case 'contextlost': {
						this.onContextLost(event.data.info);
						break;
					}
					default: {
						console.warn('Unrecognized message from worker:', event.data?.type);
					}
				}
			};
		} else {
			const babylonEngine = new BABYLON.WebGPUEngine(canvas, { doNotHandleContextLost: true, powerPreference: 'high-performance', antialias: this.options.antialias });
			babylonEngine.compatibilityMode = false;
			babylonEngine.enableOfflineSupport = false;
			await babylonEngine.initAsync();
			// doNotHandleContextLostがtrueだとそもそも呼ばれない
			//babylonEngine.onContextLostObservable.add(() => {
			//	os.alert({
			//		type: 'error',
			//		title: i18n.ts.somethingHappened,
			//		text: i18n.ts._miWorld.crushed_description,
			//	});
			//});
			babylonEngine._device.lost.then((info) => { // TODO: babylonEngineの内部プロパティに依存しない方法をforumで聞く
				this.onContextLost(info);
			});
			if (this.options.resolution === 2) babylonEngine.setHardwareScalingLevel(0.5);
			if (this.options.resolution === 0.5) babylonEngine.setHardwareScalingLevel(2);

			this.engine = await params.createEngine(babylonEngine);

			this.engine.on('ev', ({ type, ctx }) => {
				engineEvents.emit(type, ctx);
			});

			await this.engine.init();

			this.initializeProgress.value = 1;
			this.isReady.value = true;

			if (_DEV_) {
				(window as any).showBabylonInspector = () => {
					import('@babylonjs/inspector').then(({ ShowInspector }) => {
						ShowInspector(this.engine.scene);
					});
				};
			}
		}

		this.canvas.addEventListener('keydown', (ev) => {
			if (this.worker != null) {
				this.worker.postMessage({ type: 'input:keydown', ev: { code: ev.code, shiftKey: ev.shiftKey } });
			} else if (this.engine != null) {
				this.engine.inputs.emit('keydown', { code: ev.code, shiftKey: ev.shiftKey });
			}
			ev.preventDefault();
			ev.stopPropagation();
			return false;
		}, { signal: this.abortController.signal });

		this.canvas.addEventListener('keyup', (ev) => {
			if (this.worker != null) {
				this.worker.postMessage({ type: 'input:keyup', ev: { code: ev.code, shiftKey: ev.shiftKey } });
			} else if (this.engine != null) {
				this.engine.inputs.emit('keyup', { code: ev.code, shiftKey: ev.shiftKey });
			}
			ev.preventDefault();
			ev.stopPropagation();
			return false;
		}, { signal: this.abortController.signal });

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
						this.worker.postMessage({ type: 'input:zoom', ev: { delta: delta } });
					} else if (this.engine != null) {
						this.engine.inputs.emit('zoom', { delta: delta });
					}
				}
				prevTwoTouchPointsDistance = distance;

				pointerVec = { x: 0, y: 0 };
				if (this.worker != null) {
					this.worker.postMessage({ type: 'input:pointer', ev: { x: 0, y: 0 } });
				} else if (this.engine != null) {
					this.engine.inputs.emit('pointer', { x: 0, y: 0 });
				}

				return;
			}

			prevTwoTouchPointsDistance = 0;

			const before = pointerVec;
			const after = { x: ev.clientX, y: ev.clientY };

			if (pointerVec.x !== 0 || pointerVec.y !== 0) {
				if (this.worker != null) {
					this.worker.postMessage({ type: 'input:pointer', ev: {
						x: after.x - before.x,
						y: after.y - before.y,
					} });
				} else if (this.engine != null) {
					this.engine.inputs.emit('pointer', {
						x: after.x - before.x,
						y: after.y - before.y,
					});
				}
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
			if (this.worker != null) {
				this.worker.postMessage({ type: 'input:pointer', ev: pointerVec });
			} else if (this.engine != null) {
				this.engine.inputs.emit('pointer', pointerVec);
			}

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

		return {
			engineEvents,
		};
	}

	protected async _reset_() {
		this.destroy();
		this.abortController = new AbortController();
		this.isReady.value = false;
		this.initializeProgress.value = 0;
	}

	private onContextLost(info) {
		console.log('Context lost:', info);
		if (info.reason === 'destroyed') return; // 正常な終了なので
		os.alert({
			type: 'error',
			title: i18n.ts.somethingHappened,
			text: i18n.ts._miWorld.crushed_description + '\nERR: ' + info.message,
		});
	}

	private callCounter = 0;

	protected call<FN extends keyof T>(fn: FN, args: Parameters<T[FN]> = [] as any): void {
		if (!this.isReady.value) {
			throw new Error('Engine is not initialized');
		}
		if (this.worker != null) {
			this.worker.postMessage({ type: 'call', fn, args });
		} else if (this.engine != null) {
			this.engine[fn](...args);
		} else {
			throw new Error('Engine is not initialized');
		}
	}

	protected callAndWaitReturn<FN extends keyof T>(fn: FN, args: Parameters<T[FN]> = [] as any): ReturnType<T[FN]> extends Promise<any> ? ReturnType<T[FN]> : Promise<ReturnType<T[FN]>> {
		if (!this.isReady.value) {
			throw new Error('Engine is not initialized');
		}
		if (this.worker != null) {
			return new Promise((resolve) => {
				const id = this.callCounter++;
				this.returnHooks.set(id, (value) => {
					resolve(value);
				});
				this.worker!.postMessage({ type: 'call', fn, args, needReturnValue: true, id });
			});
		} else if (this.engine != null) {
			return new Promise((resolve) => {
				resolve(this.engine![fn](...args));
			});
		} else {
			throw new Error('Engine is not initialized');
		}
	}

	protected set<K extends keyof T>(key: K, value: T[K]) {
		if (!this.isReady.value) {
			throw new Error('Engine is not initialized');
		}
		if (this.worker != null) {
			this.worker.postMessage({ type: 'set', key, value });
		} else if (this.engine != null) {
			this.engine[key] = value;
		} else {
			throw new Error('Engine is not initialized');
		}
	}

	public pauseRender() {
		this.call('pauseRender');
	}

	public resumeRender() {
		this.call('resumeRender');
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

	// TODO: isReadyになる前に呼ばれたらメモリリークしそうな気もするから調査の上いい感じにする
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
