/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ref, shallowRef } from 'vue';
import { cm } from '../utility.js';
import { EngineControllerBase } from '../engineControllerBase.js';
import type { ShallowRef } from 'vue';
import type { RoomEngine, RoomState } from './engine.js';
import type { RoomStateObject } from './object.js';
import type { RoomAttachments } from './utility.js';
import * as sound from '@/utility/sound.js';
import { deepEqual } from '@/utility/deep-equal.js';
import { deepClone } from '@/utility/clone.js';

export type RoomControllerOptions = {
	workerMode?: boolean;
	graphicsQuality: number;
	fps: number | null;
	resolution: number;
	antialias: boolean;
	useVirtualJoystick?: boolean;
};

// 抽象化レイヤー
export class RoomController extends EngineControllerBase<RoomEngine> {
	public isSitting = ref(false);
	public isEditMode = ref(false);
	public isRoomLightOn = ref(true);
	public grabbing = ref<{ forInstall: boolean } | null>(null);
	public gridSnapping = ref({ enabled: true, scale: cm(4) });
	public selected = ref<{
		objectId: string;
		objectState: RoomStateObject;
	} | null>(null);
	public roomState: ShallowRef<RoomState>;

	constructor(roomState: RoomState, options: RoomControllerOptions) {
		super(options);
		this.roomState = shallowRef(deepClone(roomState));
	}

	public async init(canvas: HTMLCanvasElement, attachments: RoomAttachments) {
		const { engineEvents } = await this._init_(canvas, {
			createWorker: (offscreen) => new Promise((resolve) => {
				import('./worker?worker').then(({ default: RoomWorker }) => {
					const worker = new RoomWorker();
					worker.postMessage({ type: 'init', canvas: offscreen, options: this.options, roomState: this.roomState.value, roomAttachments: attachments }, [offscreen]);
					resolve(worker);
				});
			}),
			createEngine: (babylonEngine) => new Promise((resolve) => {
				import('./engine.js').then(({ RoomEngine }) => {
					resolve(new RoomEngine(this.roomState.value, attachments, {
						engine: babylonEngine,
						...this.options,
					}));
				});
			}),
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
			this.selected.value = deepClone(selected);
		});

		engineEvents.on('changeRoomState', ({ roomState }) => {
			if (deepEqual(this.roomState.value, roomState)) return; // vueのリアクティビティが反応して無限ループになることがあるため
			this.roomState.value = deepClone(roomState);
			if (this.selected.value != null) {
				const newSelected = roomState.installedObjects.find(o => o.id === this.selected.value.objectId);
				if (newSelected) {
					this.selected.value = {
						objectId: newSelected.id,

						// そのまま入れると「オブジェクト(newSelected)の内容」は変わってるけど「オブジェクトの参照」そのものは変化していないから、
						// その状態で代入しようがtriggerRef呼ぼうがVueは「子に対しては」更新があったと見做してくれない(親から当該refをwatchする場合は発火する)っぽい(バグか仕様かは不明)
						// そのため新しい参照にするためにdeepClone
						objectState: deepClone(newSelected),
					};
				} else {
					this.selected.value = null;
				}
			}
		});

		engineEvents.on('playSfxUrl', ({ url, options }) => {
			sound.playUrl(url, options);
		});
	}

	public async reset(canvas: HTMLCanvasElement, attachments: RoomAttachments, roomState?: RoomState | null, options?: RoomControllerOptions | null) {
		this._reset_();
		if (roomState != null) this.roomState.value = roomState;
		if (options != null) this.options = options;
		this.isSitting.value = false;
		this.isEditMode.value = false;
		this.isRoomLightOn.value = true;
		this.grabbing.value = null;
		this.selected.value = null;
		await this.init(canvas, attachments);
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

	public updateObjectOption(objectId: string, key: string, value: any, attachments?: RoomAttachments) {
		this.call('updateObjectOption', deepClone([objectId, key, value, attachments])); // 場合によってはvueによって(postMessage不能な)proxy化された値が来ることも考えられるのでdeepClone
	}

	// エラーになる
	//public changeEnvType(type: RoomState['env']['type']) {
	//	this.call('changeEnvType', [type]);
	//}

	public updateEnvOptions(options: RoomState['env']['options']) {
		this.call('updateEnvOptions', [options]);
	}

	public updateRoomLightColor(color: [number, number, number]) {
		this.call('updateRoomLightColor', [color]);
	}

	public beginSelectedInstalledObjectGrabbing() {
		this.call('beginSelectedInstalledObjectGrabbing');
	}

	public duplicateSelectedObject() {
		this.call('duplicateSelectedObject');
	}

	public removeSelectedObject() {
		this.call('removeSelectedObject');
	}

	public addObject(type: string, options: any, attachments?: RoomAttachments) {
		this.call('addObject', deepClone([type, options, attachments])); // 場合によってはvueによって(postMessage不能な)proxy化された値が来ることも考えられるのでdeepClone
	}

	public endGrabbing() {
		this.call('endGrabbing');
	}

	public cancelGrabbing() {
		this.call('endGrabbing', [true]);
	}

	public changeGrabbingDistance(delta: number) {
		this.call('changeGrabbingDistance', [delta]);
	}

	public changeGrabbingRotation(delta: number) {
		this.call('changeGrabbingRotation', [delta]);
	}

	public toggleRoomLight() {
		if (this.isRoomLightOn.value) {
			this.call('turnOffRoomLight');
		} else {
			this.call('turnOnRoomLight');
		}
		this.isRoomLightOn.value = !this.isRoomLightOn.value;
	}
}
