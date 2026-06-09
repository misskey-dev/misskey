/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ref, shallowRef } from 'vue';
import { cm } from 'misskey-world/src/utility.js';
import { EngineControllerBase, WASD } from '../EngineControllerBase.js';
import type { ShallowRef } from 'vue';
import type { RoomState_InstalledFurniture } from 'misskey-world/src/room/furniture.js';
import type { RoomEngine } from 'misskey-world-engine/src/room/engine.js';
import type { RoomAttachments, RoomState } from 'misskey-world/src/room/type.js';
import type { PlayerProfile, PlayerState } from 'misskey-world-engine/src/PlayerContainer.js';
import * as sound from '@/utility/sound.js';
import { deepEqual } from '@/utility/deep-equal.js';
import { deepClone } from '@/utility/clone.js';

export type RoomControllerOptions = {
	workerMode?: boolean;
	graphicsQuality: number;
	fps: number | null;
	resolution: number;
	antialias: boolean;
	fov: number;
	useVirtualJoystick?: boolean;
};

// 抽象化レイヤー
export class RoomController extends EngineControllerBase<RoomEngine, {
	'playerPointed': { playerId: string; };
}> {
	public isSitting = ref(false);
	public isEditMode = ref(false);
	public isRoomLightOn = ref(true);
	public grabbing = ref<{ forInstall: boolean } | null>(null);
	public gridSnapping = ref({ enabled: true, scale: cm(4) });
	public selected = shallowRef<{
		furnitureId: string;
		funitureState: RoomState_InstalledFurniture;
		interacions: {
			id: string;
			label: string;
			isPrimary: boolean;
		}[];
	} | null>(null);
	public roomState: ShallowRef<RoomState>;
	public myPlayerState = shallowRef<PlayerState>({
		position: [0, 0, 0],
		rotation: [0, 0, 0],
	});

	constructor(roomState: RoomState, options: RoomControllerOptions) {
		super(options, new WASD({
			setCameraMoveVector: (vec, dash) => {
				this.call('cameraMove', [vec, dash]);
			},
		}));
		this.roomState = shallowRef(deepClone(roomState));
	}

	public async init(canvas: HTMLCanvasElement, attachments: RoomAttachments) {
		const { engineEvents } = await this._init_(canvas, {
			createWorker: (offscreen) => new Promise((resolve) => {
				import('frontend-misskey-world-engine/src/room/worker?worker').then(({ default: RoomWorker }) => {
					const worker = new RoomWorker();
					worker.postMessage({ type: 'init', canvas: offscreen, options: this.options, roomState: this.roomState.value, roomAttachments: attachments }, [offscreen]);
					resolve(worker);
				});
			}),
			createEngine: () => new Promise((resolve) => {
				import('frontend-misskey-world-engine/src/room/nonWorker.js').then(({ createRoomEngine }) => {
					const engine = createRoomEngine({ canvas, options: this.options, roomState: this.roomState.value, roomAttachments: attachments });
					resolve(engine);
				});
			}),
		});

		engineEvents.on('changeGrabbingState', ({ grabbing }) => {
			this.grabbing.value = grabbing;
		});

		engineEvents.on('changeEditMode', ({ isEditMode }) => {
			this.isEditMode.value = isEditMode;
		});

		engineEvents.on('changeSittingState', ({ isSitting }) => {
			this.isSitting.value = isSitting;
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
				const newSelected = roomState.installedFurnitures.find(o => o.id === this.selected.value.furnitureId);
				if (newSelected) {
					this.selected.value = {
						furnitureId: newSelected.id,

						// そのまま入れると「オブジェクト(newSelected)の内容」は変わってるけど「オブジェクトの参照」そのものは変化していないから、
						// その状態で代入しようがtriggerRef呼ぼうがVueは「子に対しては」更新があったと見做してくれない(親から当該refをwatchする場合は発火する)っぽい(バグか仕様かは不明)
						// そのため新しい参照にするためにdeepClone
						funitureState: deepClone(newSelected),
					};
				} else {
					this.selected.value = null;
				}
			}
		});

		engineEvents.on('changeMyPlayerState', (playerState) => {
			this.myPlayerState.value = playerState;
		});

		engineEvents.on('playSfxUrl', ({ url, options }) => {
			sound.playUrl(url, options);
		});

		engineEvents.on('playerPointed', ({ playerId }) => {
			this.emit('playerPointed', { playerId });
		});
	}

	public async reset(canvas: HTMLCanvasElement, attachments: RoomAttachments, roomState?: RoomState | null, options?: RoomControllerOptions | null) {
		this._reset_();
		if (roomState != null) this.roomState.value = deepClone(roomState);
		if (options != null) this.options = options;
		this.isSitting.value = false;
		this.isEditMode.value = false;
		this.isRoomLightOn.value = true;
		this.grabbing.value = null;
		this.selected.value = null;
		this.myPlayerState.value = {
			position: [0, 0, 0],
			rotation: [0, 0, 0],
		};
		await this.init(canvas, attachments);
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

	public updateFurnitureOption(furnitureId: string, key: string, value: any, attachments?: RoomAttachments) {
		this.call('updateFurnitureOption', deepClone([furnitureId, key, value, attachments])); // 場合によってはvueによって(postMessage不能な)proxy化された値が来ることも考えられるのでdeepClone
	}

	// エラーになる
	//public changeEnvType(type: RoomState['env']['type']) {
	//	this.call('changeEnvType', [type]);
	//}

	public updateEnvOptions(options: RoomState['env']['options']) {
		this.call('updateEnvOptions', [options]);
	}

	public updateLightSettings(light: RoomState['light']) {
		this.call('updateLightSettings', [light]);
	}

	public beginSelectedInstalledFunitureGrabbing() {
		this.call('beginSelectedInstalledFunitureGrabbing');
	}

	public duplicateSelectedFuniture() {
		this.call('duplicateSelectedFuniture');
	}

	public removeSelectedFuniture() {
		this.call('removeSelectedFuniture');
	}

	public addFuniture(type: string, options: any, attachments?: RoomAttachments) {
		this.call('addFuniture', deepClone([type, options, attachments])); // 場合によってはvueによって(postMessage不能な)proxy化された値が来ることも考えられるのでdeepClone
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

	public interact(id: string) {
		this.call('interact', [this.selected.value!.furnitureId, id]);
	}

	public sit() {
		this.call('sit');
	}

	public lyingDown() {
		this.call('lyingDown');
	}

	public standUp() {
		this.call('standUp');
	}

	public updatePlayerProfiles(profiles: Record<string, PlayerProfile>) {
		this.call('updatePlayerProfiles', [profiles]);
	}

	public updatePlayerStates(states: Record<string, PlayerState>) {
		this.call('updatePlayerStates', [states]);
	}

	public clearPlayers() {
		this.call('clearPlayers');
	}
}
