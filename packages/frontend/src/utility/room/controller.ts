/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { reactive, ref, shallowRef, triggerRef, watch } from 'vue';
import * as BABYLON from '@babylonjs/core';
import RoomWorker from './worker?worker';
import { RoomEngine } from './engine.js';
import type { ShallowRef } from 'vue';
import type { ObjectDef, RoomState, RoomStateObject } from './engine.js';
import * as sound from '@/utility/sound.js';

// 抽象化レイヤー
export class RoomController {
	private worker: Worker | null = null;
	private engine: RoomEngine | null = null;
	private canvas: HTMLCanvasElement | null = null;
	public isReady = ref(false);
	public isSitting = ref(false);
	public isEditMode = ref(false);
	public grabbing = ref<{ forInstall: boolean } | null>(null);
	public gridSnapping = ref({ enabled: true, scale: 4 });
	public selected = ref<{
		objectId: string;
		objectState: RoomStateObject;
		objectDef: ObjectDef;
	} | null>(null);
	public roomState: ShallowRef<RoomState>;

	constructor(roomState: RoomState) {
		this.roomState = shallowRef(roomState);
	}

	public async init(canvas: HTMLCanvasElement, workerMode = false) {
		this.canvas = canvas;
		this.canvas.width = canvas.clientWidth;
		this.canvas.height = canvas.clientHeight;

		if (workerMode) {
			const offscreen = canvas.transferControlToOffscreen();
			this.worker = new RoomWorker();
			this.worker.postMessage({ type: 'init', canvas: offscreen, roomState: this.roomState.value }, [offscreen]);
			this.isReady.value = true;
		} else {
			const babylonEngine = new BABYLON.WebGPUEngine(canvas);
			babylonEngine.compatibilityMode = false;
			babylonEngine.initAsync().then(() => {
				this.engine = new RoomEngine(this.roomState.value, { canvas, engine: babylonEngine });
				this.engine.init();
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

	public addObject(type: string) {
		if (this.worker != null) {
			this.worker.postMessage({ type: 'addObject', objectType: type });
		} else if (this.engine != null) {
			this.engine.addObject(type);
		}
	}

	public endGrabbing() {
		if (this.worker != null) {
			this.worker.postMessage({ type: 'endGrabbing' });
		} else if (this.engine != null) {
			this.engine.endGrabbing();
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
