/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { reactive, ref, shallowRef, triggerRef, watch } from 'vue';
import * as BABYLON from '@babylonjs/core';
import { WorldEngine } from './engine.js';
import type { ShallowRef } from 'vue';
import * as sound from '@/utility/sound.js';

// 抽象化レイヤー
export class WorldController {
	private worker: Worker | null = null;
	private engine: WorldEngine | null = null;
	private canvas: HTMLCanvasElement | null = null;
	public isReady = ref(false);
	public isSitting = ref(false);
	public initializeProgress = ref(0);

	constructor() {
	}

	public async init(canvas: HTMLCanvasElement, workerMode = false) {
		this.canvas = canvas;
		this.canvas.width = canvas.clientWidth;
		this.canvas.height = canvas.clientHeight;

		if (workerMode) {
			//const offscreen = canvas.transferControlToOffscreen();
			//this.worker = new RoomWorker();
			//this.worker.postMessage({ type: 'init', canvas: offscreen }, [offscreen]);
			//this.isReady.value = true;
		} else {
			const babylonEngine = new BABYLON.WebGPUEngine(canvas, { doNotHandleContextLost: true });
			babylonEngine.compatibilityMode = false;
			await babylonEngine.initAsync();
			this.engine = new WorldEngine({ canvas, engine: babylonEngine });
			this.engine.on('loadingProgress', ({ progress }) => {
				this.initializeProgress.value = progress;
			});
			await this.engine.init();
			this.initializeProgress.value = 1;
			this.isReady.value = true;

			this.engine.on('playSfxUrl', ({ url, options }) => {
				sound.playUrl(url, options);
			});
		}

		this.canvas.addEventListener('keydown', (ev) => {
			if (this.worker != null) {
				this.worker.postMessage({ type: 'dom:keydown', ev: { code: ev.code, shiftKey: ev.shiftKey } });
			} else if (this.engine != null) {
				this.engine.domEvents.emit('keydown', { code: ev.code, shiftKey: ev.shiftKey });
			}
			ev.preventDefault();
			ev.stopPropagation();
			return false;
		});

		this.canvas.addEventListener('keyup', (ev) => {
			if (this.worker != null) {
				this.worker.postMessage({ type: 'dom:keyup', ev: { code: ev.code, shiftKey: ev.shiftKey } });
			} else if (this.engine != null) {
				this.engine.domEvents.emit('keyup', { code: ev.code, shiftKey: ev.shiftKey });
			}
			ev.preventDefault();
			ev.stopPropagation();
			return false;
		});

		this.canvas.addEventListener('pointerdown', (ev) => {
			// todo
		});

		this.canvas.addEventListener('wheel', (ev) => {
			if (this.worker != null) {
				this.worker.postMessage({ type: 'dom:wheel', ev: { deltaY: ev.deltaY } });
			} else if (this.engine != null) {
				this.engine.domEvents.emit('wheel', { deltaY: ev.deltaY });
			}
			ev.preventDefault();
			ev.stopPropagation();
			return false;
		});

		let isDragging = false;

		this.canvas.addEventListener('pointerdown', (ev) => {
			this.canvas.setPointerCapture(ev.pointerId);
		});

		this.canvas.addEventListener('pointermove', (ev) => {
			if (this.canvas.hasPointerCapture(ev.pointerId)) {
				isDragging = true;
			}
		});

		this.canvas.addEventListener('pointerup', (ev) => {
			window.setTimeout(() => {
				isDragging = false;
				this.canvas.releasePointerCapture(ev.pointerId);
			}, 0);
		});

		this.canvas.addEventListener('click', (ev) => {
			if (isDragging) return;
			if (this.worker != null) {
				this.worker.postMessage({ type: 'dom:click', ev: { offsetX: ev.offsetX, offsetY: ev.offsetY } });
			} else if (this.engine != null) {
				this.engine.domEvents.emit('click', { offsetX: ev.offsetX, offsetY: ev.offsetY });
			}
			ev.preventDefault();
			ev.stopPropagation();
			return false;
		});
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
