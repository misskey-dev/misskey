/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { reactive, ref, shallowRef, triggerRef, watch } from 'vue';
import * as BABYLON from '@babylonjs/core';
import { cm } from '../utility.js';
import RoomWorker from './worker?worker';
import { RoomEngine } from './engine.js';
import type { ShallowRef } from 'vue';
import type { RoomState } from './engine.js';
import type { ObjectDef, RoomStateObject } from './object.js';
import * as sound from '@/utility/sound.js';

type Options = {
	workerMode?: boolean;
	graphicsQuality?: 'low' | 'medium' | 'high';
};

// 抽象化レイヤー
export class RoomController {
	private worker: Worker | null = null;
	private engine: RoomEngine | null = null;
	private canvas: HTMLCanvasElement | null = null;
	private options: Options = {};
	private isCanvasDragging = false;
	public isReady = ref(false);
	public isSitting = ref(false);
	public isEditMode = ref(false);
	public grabbing = ref<{ forInstall: boolean } | null>(null);
	public gridSnapping = ref({ enabled: true, scale: cm(4) });
	public selected = ref<{
		objectId: string;
		objectState: RoomStateObject;
		objectDef: ObjectDef;
	} | null>(null);
	public roomState: ShallowRef<RoomState>;
	public initializeProgress = ref(0);

	constructor(roomState: RoomState) {
		this.roomState = shallowRef(roomState);

		this.onCanvasKeydown = this.onCanvasKeydown.bind(this);
		this.onCanvasKeyup = this.onCanvasKeyup.bind(this);
		this.onCanvasWheel = this.onCanvasWheel.bind(this);
		this.onCanvasPointerdown = this.onCanvasPointerdown.bind(this);
		this.onCanvasPointermove = this.onCanvasPointermove.bind(this);
		this.onCanvasPointerup = this.onCanvasPointerup.bind(this);
		this.onCanvasClick = this.onCanvasClick.bind(this);
	}

	public async init(canvas: HTMLCanvasElement, options: Options = {}) {
		this.canvas = canvas;
		this.canvas.width = canvas.clientWidth;
		this.canvas.height = canvas.clientHeight;
		this.options = options;

		if (options.workerMode) {
			const offscreen = canvas.transferControlToOffscreen();
			this.worker = new RoomWorker();
			this.worker.postMessage({ type: 'init', canvas: offscreen, roomState: this.roomState.value, graphicsQuality: options.graphicsQuality }, [offscreen]);
			this.isReady.value = true;
		} else {
			const babylonEngine = new BABYLON.WebGPUEngine(canvas, { doNotHandleContextLost: true });
			babylonEngine.compatibilityMode = false;
			await babylonEngine.initAsync();

			this.engine = new RoomEngine(this.roomState.value, { canvas, engine: babylonEngine, graphicsQuality: options.graphicsQuality });
			this.engine.on('loadingProgress', ({ progress }) => {
				this.initializeProgress.value = progress;
			});
			await this.engine.init();
			this.initializeProgress.value = 1;
			this.isReady.value = true;

			this.engine.on('changeGrabbingState', ({ grabbing }) => {
				this.grabbing.value = grabbing;
			});

			this.engine.on('changeEditMode', ({ isEditMode }) => {
				this.isEditMode.value = isEditMode;
			});

			this.engine.on('changeGridSnapping', ({ gridSnapping }) => {
				this.gridSnapping.value = gridSnapping;
			});

			this.engine.on('changeSelectedState', ({ selected }) => {
				this.selected.value = selected;
			});

			this.engine.on('changeRoomState', ({ roomState }) => {
				this.roomState.value = roomState;
				triggerRef(this.selected);
			});

			this.engine.on('playSfxUrl', ({ url, options }) => {
				sound.playUrl(url, options);
			});
		}

		this.canvas.addEventListener('keydown', this.onCanvasKeydown);
		this.canvas.addEventListener('keyup', this.onCanvasKeyup);
		this.canvas.addEventListener('wheel', this.onCanvasWheel);
		this.canvas.addEventListener('pointerdown', this.onCanvasPointerdown);
		this.canvas.addEventListener('pointermove', this.onCanvasPointermove);
		this.canvas.addEventListener('pointerup', this.onCanvasPointerup);
		this.canvas.addEventListener('click', this.onCanvasClick);
	}

	private onCanvasKeydown(ev: KeyboardEvent) {
		if (this.worker != null) {
			this.worker.postMessage({ type: 'dom:keydown', ev: { code: ev.code, shiftKey: ev.shiftKey } });
		} else if (this.engine != null) {
			this.engine.domEvents.emit('keydown', { code: ev.code, shiftKey: ev.shiftKey });
		}
		ev.preventDefault();
		ev.stopPropagation();
		return false;
	}

	private onCanvasKeyup(ev: KeyboardEvent) {
		if (this.worker != null) {
			this.worker.postMessage({ type: 'dom:keyup', ev: { code: ev.code, shiftKey: ev.shiftKey } });
		} else if (this.engine != null) {
			this.engine.domEvents.emit('keyup', { code: ev.code, shiftKey: ev.shiftKey });
		}
		ev.preventDefault();
		ev.stopPropagation();
		return false;
	}

	private onCanvasWheel(ev: WheelEvent) {
		if (this.worker != null) {
			this.worker.postMessage({ type: 'dom:wheel', ev: { deltaY: ev.deltaY } });
		} else if (this.engine != null) {
			this.engine.domEvents.emit('wheel', { deltaY: ev.deltaY });
		}
		ev.preventDefault();
		ev.stopPropagation();
		return false;
	}

	private onCanvasPointerdown(ev: PointerEvent) {
		this.canvas?.setPointerCapture(ev.pointerId);
	}

	private onCanvasPointermove(ev: PointerEvent) {
		if (this.canvas?.hasPointerCapture(ev.pointerId)) {
			this.isCanvasDragging = true;
		}
	}

	private onCanvasPointerup(ev: PointerEvent) {
		window.setTimeout(() => {
			this.isCanvasDragging = false;
			this.canvas?.releasePointerCapture(ev.pointerId);
		}, 0);
	}

	private onCanvasClick(ev: MouseEvent) {
		if (this.isCanvasDragging) return;
		if (this.worker != null) {
			this.worker.postMessage({ type: 'dom:click', ev: { offsetX: ev.offsetX, offsetY: ev.offsetY } });
		} else if (this.engine != null) {
			this.engine.domEvents.emit('click', { offsetX: ev.offsetX, offsetY: ev.offsetY });
		}
		ev.preventDefault();
		ev.stopPropagation();
		return false;
	}

	public async reset(roomState?: RoomState, canvas?: HTMLCanvasElement, options: Options = {}) {
		this.destroy();
		if (roomState != null) this.roomState.value = roomState;
		this.isReady.value = false;
		this.isSitting.value = false;
		this.isEditMode.value = false;
		this.grabbing.value = null;
		this.selected.value = null;
		this.initializeProgress.value = 0;
		await this.init(canvas ?? this.canvas!, options ?? this.options);
	}

	public pauseRender() {
		if (this.worker != null) {
			this.worker.postMessage({ type: 'pauseRender' });
		} else if (this.engine != null) {
			this.engine.pauseRender();
		}
	}

	public resumeRender() {
		if (this.worker != null) {
			this.worker.postMessage({ type: 'resumeRender' });
		} else if (this.engine != null) {
			this.engine.resumeRender();
		}
	}

	public enterEditMode() {
		if (this.worker != null) {
			this.worker.postMessage({ type: 'enterEditMode' });
		} else if (this.engine != null) {
			this.engine.enterEditMode();
		}
	}

	public exitEditMode() {
		if (this.worker != null) {
			this.worker.postMessage({ type: 'exitEditMode' });
		} else if (this.engine != null) {
			this.engine.exitEditMode();
		}
	}

	public setGridSnapping(gridSnapping: { enabled: boolean; scale: number }) {
		if (this.worker != null) {
			this.worker.postMessage({ type: 'setGridSnapping', gridSnapping });
		} else if (this.engine != null) {
			this.engine.gridSnapping = gridSnapping;
		}
	}

	public updateObjectOption(objectId: string, key: string, value: any) {
		if (this.worker != null) {
			this.worker.postMessage({ type: 'updateObjectOption', objectId, key, value });
		} else if (this.engine != null) {
			this.engine.updateObjectOption(objectId, key, value);
		}
	}

	public changeHeyaType(type: RoomState['heya']['type']) {
		if (this.worker != null) {
			this.worker.postMessage({ type: 'changeHeyaType', heyaType: type });
		} else if (this.engine != null) {
			this.engine.changeHeyaType(type);
		}
	}

	public updateHeyaOptions(options: RoomState['heya']['options']) {
		if (this.worker != null) {
			this.worker.postMessage({ type: 'updateHeyaOptions', heyaOptions: options });
		} else if (this.engine != null) {
			this.engine.updateHeyaOptions(options);
		}
	}

	public beginSelectedInstalledObjectGrabbing() {
		if (this.worker != null) {
			this.worker.postMessage({ type: 'beginSelectedInstalledObjectGrabbing' });
		} else if (this.engine != null) {
			this.engine.beginSelectedInstalledObjectGrabbing();
		}
	}

	public removeSelectedObject() {
		if (this.worker != null) {
			this.worker.postMessage({ type: 'removeSelectedObject' });
		} else if (this.engine != null) {
			this.engine.removeSelectedObject();
		}
	}

	public addObject(type: string, options: any) {
		if (this.worker != null) {
			this.worker.postMessage({ type: 'addObject', objectType: type, objectOptions: options });
		} else if (this.engine != null) {
			this.engine.addObject(type, options);
		}
	}

	public endGrabbing() {
		if (this.worker != null) {
			this.worker.postMessage({ type: 'endGrabbing' });
		} else if (this.engine != null) {
			this.engine.endGrabbing();
		}
	}

	public cancelGrabbing() {
		if (this.worker != null) {
			this.worker.postMessage({ type: 'cancelGrabbing' });
		} else if (this.engine != null) {
			this.engine.endGrabbing(true);
		}
	}

	public toggleRoomLight() {
		if (this.worker != null) {
			this.worker.postMessage({ type: 'toggleRoomLight' });
		} else if (this.engine != null) {
			this.engine.toggleRoomLight();
		}
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
		this.canvas?.removeEventListener('keydown', this.onCanvasKeydown);
		this.canvas?.removeEventListener('keyup', this.onCanvasKeyup);
		this.canvas?.removeEventListener('wheel', this.onCanvasWheel);
		this.canvas?.removeEventListener('pointerdown', this.onCanvasPointerdown);
		this.canvas?.removeEventListener('pointermove', this.onCanvasPointermove);
		this.canvas?.removeEventListener('pointerup', this.onCanvasPointerup);
		this.canvas?.removeEventListener('click', this.onCanvasClick);

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
