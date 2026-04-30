/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { reactive, ref, shallowRef, triggerRef, watch } from 'vue';
import * as BABYLON from '@babylonjs/core';
import { EventEmitter } from 'eventemitter3';
import { cm } from '../utility.js';
import RoomWorker from './worker?worker';
import { GRAPHICS_QUALITY_MEDIUM, RoomEngine } from './engine.js';
import type { ShallowRef } from 'vue';
import type { RoomEngineEvents, RoomState } from './engine.js';
import type { ObjectDef, RoomStateObject } from './object.js';
import * as sound from '@/utility/sound.js';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { deepEqual } from '@/utility/deep-equal.js';

export type RoomControllerOptions = {
	workerMode?: boolean;
	graphicsQuality: number;
	fps: number | null;
	resolution: number;
	antialias: boolean;
	useVirtualJoystick?: boolean;
};

// 抽象化レイヤー
export class RoomController {
	private worker: Worker | null = null;
	private engine: RoomEngine | null = null;
	private canvas: HTMLCanvasElement | null = null;
	private options: RoomControllerOptions;
	public isReady = ref(false);
	public isSitting = ref(false);
	public isEditMode = ref(false);
	public grabbing = ref<{ forInstall: boolean } | null>(null);
	public gridSnapping = ref({ enabled: true, scale: cm(4) });
	public selected = ref<{
		objectId: string;
		objectState: RoomStateObject;
	} | null>(null);
	public roomState: ShallowRef<RoomState>;
	public initializeProgress = ref(0);
	private pointerDownPosition: { x: number; y: number } | null = null;

	constructor(roomState: RoomState, options: RoomControllerOptions) {
		this.roomState = shallowRef(roomState);
		this.options = options;

		this.onCanvasKeydown = this.onCanvasKeydown.bind(this);
		this.onCanvasKeyup = this.onCanvasKeyup.bind(this);
		this.onCanvasWheel = this.onCanvasWheel.bind(this);
		this.onCanvasPointerdown = this.onCanvasPointerdown.bind(this);
		this.onCanvasPointerup = this.onCanvasPointerup.bind(this);
	}

	public async init(canvas: HTMLCanvasElement) {
		this.canvas = canvas;
		this.canvas.width = canvas.clientWidth;
		this.canvas.height = canvas.clientHeight;

		const engineEvents = new EventEmitter<RoomEngineEvents>();

		if (this.options.workerMode) {
			const offscreen = canvas.transferControlToOffscreen();
			this.worker = new RoomWorker();
			this.worker.postMessage({ type: 'init', canvas: offscreen, roomState: this.roomState.value, options: this.options }, [offscreen]);
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
					default: {
						console.warn('Unrecognized message from worker:', event.data?.type);
					}
				}
			};
		} else {
			const babylonEngine = new BABYLON.WebGPUEngine(canvas, { doNotHandleContextLost: true, powerPreference: 'high-performance', antialias: this.options.antialias });
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

			this.engine = new RoomEngine(this.roomState.value, {
				engine: babylonEngine,
				...this.options,
			});

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

		engineEvents.on('loadingProgress', ({ progress }) => {
			this.initializeProgress.value = progress;
		});

		engineEvents.on('changeGrabbingState', ({ grabbing }) => {
			this.grabbing.value = grabbing;
		});

		engineEvents.on('changeEditMode', ({ isEditMode }) => {
			this.isEditMode.value = isEditMode;
		});

		engineEvents.on('changeGridSnapping', ({ gridSnapping }) => {
			this.gridSnapping.value = gridSnapping;
		});

		engineEvents.on('changeSelectedState', ({ selected }) => {
			this.selected.value = selected;
		});

		engineEvents.on('changeRoomState', ({ roomState }) => {
			if (deepEqual(this.roomState.value, roomState)) return; // vueのリアクティビティが反応して無限ループになることがあるため
			this.roomState.value = roomState;
			triggerRef(this.selected);
		});

		engineEvents.on('playSfxUrl', ({ url, options }) => {
			sound.playUrl(url, options);
		});

		this.canvas.addEventListener('keydown', this.onCanvasKeydown);
		this.canvas.addEventListener('keyup', this.onCanvasKeyup);
		this.canvas.addEventListener('wheel', this.onCanvasWheel);
		this.canvas.addEventListener('pointerdown', this.onCanvasPointerdown);
		this.canvas.addEventListener('pointerup', this.onCanvasPointerup);
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
		ev.preventDefault();
		ev.stopPropagation();

		this.canvas!.focus();

		this.pointerDownPosition = { x: ev.offsetX, y: ev.offsetY };
		this.canvas!.setPointerCapture(ev.pointerId);

		const pointerVec = { x: ev.clientX, y: ev.clientY };

		let timeoutId: number | null = null;

		const onMove = (ev: PointerEvent) => {
			ev.preventDefault();
			ev.stopPropagation();

			if (timeoutId != null) {
				window.clearTimeout(timeoutId);
				timeoutId = null;
			}

			const before = pointerVec;
			const after = { x: ev.clientX, y: ev.clientY };

			this.setCameraRotateVector({
				x: after.x - before.x,
				y: after.y - before.y,
			});

			pointerVec.x = after.x;
			pointerVec.y = after.y;

			timeoutId = window.setTimeout(() => {
				timeoutId = null;

				this.setCameraRotateVector({
					x: 0,
					y: 0,
				});
			}, 10);

			return false;
		};

		this.canvas!.addEventListener('pointermove', onMove);

		this.canvas!.addEventListener('pointerup', (ev) => {
			this.canvas!.removeEventListener('pointermove', onMove);

			pointerVec.x = 0;
			pointerVec.y = 0;

			this.setCameraRotateVector(pointerVec);
		}, { once: true });

		return false;
	}

	private onCanvasPointerup(ev: PointerEvent) {
		if (this.pointerDownPosition != null) {
			const dx = Math.abs(ev.offsetX - this.pointerDownPosition.x);
			const dy = Math.abs(ev.offsetY - this.pointerDownPosition.y);
			if (dx < 10 && dy < 10) {
				const median = { x: (ev.offsetX + this.pointerDownPosition.x) / 2, y: (ev.offsetY + this.pointerDownPosition.y) / 2 };
				if (this.worker != null) {
					this.worker.postMessage({ type: 'dom:click', ev: { x: median.x, y: median.y } });
				} else if (this.engine != null) {
					this.engine.domEvents.emit('click', { x: median.x, y: median.y });
				}
			}
		}
		this.pointerDownPosition = null;
		this.canvas!.releasePointerCapture(ev.pointerId);
	}

	public async reset(roomState?: RoomState | null, options?: RoomControllerOptions | null, canvas?: HTMLCanvasElement | null) {
		this.destroy();
		if (roomState != null) this.roomState.value = roomState;
		if (options != null) this.options = options;
		this.isReady.value = false;
		this.isSitting.value = false;
		this.isEditMode.value = false;
		this.grabbing.value = null;
		this.selected.value = null;
		this.initializeProgress.value = 0;
		await this.init(canvas ?? this.canvas!);
	}

	// TODO: いい感じに型付け
	private call(fn, args = []) {
		if (this.worker != null) {
			this.worker.postMessage({ type: 'call', fn, args });
		} else if (this.engine != null) {
			this.engine[fn](...args);
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

	public setCameraMoveVector(vec: { x: number; y: number }, dash: boolean) {
		this.call('cameraMove', [vec, dash]);
	}

	public setCameraRotateVector(vec: { x: number; y: number }) {
		this.call('cameraRotate', [vec]);
	}

	public setCameraJoystickMoveVector(vec: { x: number; y: number }) {
		this.call('cameraJoystickMove', [vec]);
	}

	public enterEditMode() {
		this.call('enterEditMode');
	}

	public exitEditMode() {
		this.call('exitEditMode');
	}

	public setGridSnapping(gridSnapping: { enabled: boolean; scale: number }) {
		this.set('gridSnapping', gridSnapping);
	}

	public updateObjectOption(objectId: string, key: string, value: any) {
		this.call('updateObjectOption', [objectId, key, value]);
	}

	public changeHeyaType(type: RoomState['heya']['type']) {
		this.call('changeHeyaType', [type]);
	}

	public updateHeyaOptions(options: RoomState['heya']['options']) {
		this.call('updateHeyaOptions', [options]);
	}

	public updateRoomLightColor(color: [number, number, number]) {
		this.call('updateRoomLightColor', [color]);
	}

	public beginSelectedInstalledObjectGrabbing() {
		this.call('beginSelectedInstalledObjectGrabbing');
	}

	public removeSelectedObject() {
		this.call('removeSelectedObject');
	}

	public addObject(type: string, options: any) {
		this.call('addObject', [type, options]);
	}

	public endGrabbing() {
		this.call('endGrabbing');
	}

	public cancelGrabbing() {
		this.call('endGrabbing', [true]);
	}

	public toggleRoomLight() {
		this.call('toggleRoomLight');
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
		this.canvas?.removeEventListener('pointerup', this.onCanvasPointerup);

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
