/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core/pure.js';
import { cm, WORLD_SCALE } from 'misskey-world/src/utility.js';
import { EngineBase } from './EngineBase.js';
import { PlayerContainer, type PlayerProfile, type PlayerState } from './PlayerContainer.js';
import { FreeCameraManualInput } from './utility.js';

const IN_WEB_WORKER = typeof window === 'undefined';

export type MultiplayEngineBaseEvents = {
	'loadingProgress': (ctx: { progress: number }) => void;
	'contextlost': (ctx: { reason: string; message: string; }) => void;
	'changeSittingState': (ctx: { isSitting: boolean }) => void;
};

export abstract class MultiplayEngineBase<EVs extends MultiplayEngineBaseEvents> extends EngineBase<EVs> {
	protected playerProfiles: Record<string, PlayerProfile> = {};
	protected playerContainers: PlayerContainer[] = [];
	protected showUsernameOnAvatar: boolean;
	protected show2dAvatarOnAvatar: boolean;
	public camera: BABYLON.FreeCamera;
	public fixedCamera: BABYLON.FreeCamera;
	protected cameraHeight = cm(130);
	protected fov: number;
	protected isGodMode = false;

	private _isSitting = false;
	get isSitting() {
		return this._isSitting;
	}
	set isSitting(v) {
		this._isSitting = v;
		this.ev('changeSittingState', { isSitting: v });
	}

	constructor(options: {
		babylonEngine: BABYLON.WebGPUEngine;
		fps: number | null;
		showUsernameOnAvatar: boolean;
		show2dAvatarOnAvatar: boolean;
		useVirtualJoystick: boolean;
		fov: number;
		fastMovement: boolean;
	}) {
		super({
			babylonEngine: options.babylonEngine,
			fps: options.fps,
		});

		this.showUsernameOnAvatar = options.showUsernameOnAvatar;
		this.show2dAvatarOnAvatar = options.show2dAvatarOnAvatar;
		this.fov = options.fov;

		this.camera = new BABYLON.FreeCamera('', new BABYLON.Vector3(0, this.cameraHeight, cm(0)), this.scene);
		this.camera.minZ = cm(1);
		this.camera.maxZ = cm(1000);
		this.camera.fov = this.fov;
		this.camera.ellipsoid = new BABYLON.Vector3(cm(15), cm(65), cm(15));
		if (!this.isGodMode) {
			this.camera.checkCollisions = true;
			this.camera.applyGravity = true;
			this.camera.needMoveForGravity = true;
		}
		this.camera.inputs.clear();
		if (options.useVirtualJoystick) {
			this.camera.inputs.add(new FreeCameraManualInput(this.scene, {
				moveSensitivity: options.fastMovement ? 0.02 * WORLD_SCALE : 0.015 * WORLD_SCALE,
				rotationSensitivity: 0.0007,
				isGodMode: this.isGodMode,
			}));
			this.camera.inertia = 0.75;
		} else {
			this.camera.inputs.add(new FreeCameraManualInput(this.scene, {
				moveSensitivity: options.fastMovement ? 0.003 * WORLD_SCALE : 0.002 * WORLD_SCALE,
				rotationSensitivity: 0.0003,
				isGodMode: this.isGodMode,
			}));
		}

		this.scene.activeCamera = this.camera;

		this.fixedCamera = new BABYLON.FreeCamera('', new BABYLON.Vector3(0, cm(130), cm(0)), this.scene);
		this.fixedCamera.minZ = cm(1);
		this.fixedCamera.maxZ = cm(1000);
		this.fixedCamera.inputs.clear();
		this.fixedCamera.inputs.add(new FreeCameraManualInput(this.scene, {
			moveSensitivity: 0.002 * WORLD_SCALE,
			rotationSensitivity: 0.0003,
		}));
	}

	public sit() {
		this.isSitting = true;
		this.sr.disableSnapshotRendering();
		this.fixedCamera.parent = null;
		this.fixedCamera.position = new BABYLON.Vector3(this.camera.position.x, cm(70), this.camera.position.z);
		this.fixedCamera.rotation = new BABYLON.Vector3(this.camera.rotation.x, this.camera.rotation.y, this.camera.rotation.z);
		this.fixedCamera.maxZ = this.camera.maxZ;
		this.scene.activeCamera = this.fixedCamera;
		this.sr.enableSnapshotRendering();
	}

	public lyingDown() {
		this.isSitting = true;
		this.sr.disableSnapshotRendering();
		this.fixedCamera.parent = null;
		this.fixedCamera.position = new BABYLON.Vector3(this.camera.position.x, cm(20), this.camera.position.z);
		this.fixedCamera.rotation = new BABYLON.Vector3(-(Math.PI / 2) + 0.001, this.camera.rotation.y, this.camera.rotation.z);
		this.fixedCamera.maxZ = this.camera.maxZ;
		this.scene.activeCamera = this.fixedCamera;
		this.sr.enableSnapshotRendering();
	}

	public standUp() {
		this.isSitting = false;
		this.scene.activeCamera = this.camera;
		this.fixedCamera.parent = null;
	}

	public updatePlayerProfiles(profiles: Record<string, PlayerProfile>) {
		this.playerProfiles = profiles;

		for (const playerContainer of this.playerContainers) {
			if (this.playerProfiles[playerContainer.id] == null) {
				this.sr.disableSnapshotRendering();
				playerContainer.destroy();
				this.sr.enableSnapshotRendering();
			}
		}
		this.playerContainers = this.playerContainers.filter(p => this.playerProfiles[p.id] != null);
	}

	public updatePlayerStates(states: Record<string, PlayerState>) {
		for (const [k, v] of Object.entries(this.playerProfiles)) {
			const playerContainer = this.playerContainers.find(p => p.id === k);
			if (playerContainer == null) {
				const p = new PlayerContainer({
					id: k,
					profile: v,
					state: states[k],
					scene: this.scene,
					sr: this.sr,
					showUsername: this.showUsernameOnAvatar,
					show2dAvatar: this.show2dAvatarOnAvatar,
				});
				// TODO: loadFurnitureのものとある程度共通化
				p.registerMeshes = (meshes) => {
					for (const mesh of meshes) {
						mesh.receiveShadows = false;
						mesh.metadata = { isPlayer: true, playerId: k };

						//if (mesh.material) (mesh.material as BABYLON.PBRMaterial).ambientColor = new BABYLON.Color3(0.2, 0.2, 0.2);
						if (mesh.material) {
							if (mesh.material instanceof BABYLON.MultiMaterial) {
								for (const subMat of mesh.material.subMaterials) {
									if ((subMat as BABYLON.PBRMaterial).subSurface.isRefractionEnabled) {
										(subMat as BABYLON.PBRMaterial).subSurface.isRefractionEnabled = false; // 有効にするとドローコールが激増する
										(subMat as BABYLON.PBRMaterial).transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHABLEND;
										(subMat as BABYLON.PBRMaterial).alpha = 0.5;
										(subMat as BABYLON.PBRMaterial).metallic = 1;
									}
									(subMat as BABYLON.PBRMaterial).reflectionTexture = this.getEnvMap();
									if ((subMat as BABYLON.PBRMaterial).metadata == null) (subMat as BABYLON.PBRMaterial).metadata = {};
									(subMat as BABYLON.PBRMaterial).metadata.useEnvMap = true;
									(subMat as BABYLON.PBRMaterial).useGLTFLightFalloff = true; // Clustered Lightingではphysical falloffを持つマテリアルはアーチファクトが発生する https://doc.babylonjs.com/features/featuresDeepDive/lights/clusteredLighting/#materials-with-a-physical-falloff-may-cause-artefacts
									(subMat as BABYLON.PBRMaterial).anisotropy.isEnabled = false; // なんかきれいにレンダリングされないため
								}
							} else {
								if ((mesh.material as BABYLON.PBRMaterial).subSurface.isRefractionEnabled) {
									(mesh.material as BABYLON.PBRMaterial).subSurface.isRefractionEnabled = false; // 有効にするとドローコールが激増する
									(mesh.material as BABYLON.PBRMaterial).transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHABLEND;
									(mesh.material as BABYLON.PBRMaterial).alpha = 0.5;
									(mesh.material as BABYLON.PBRMaterial).metallic = 1;
								}
								(mesh.material as BABYLON.PBRMaterial).reflectionTexture = this.getEnvMap();
								if ((mesh.material as BABYLON.PBRMaterial).metadata == null) (mesh.material as BABYLON.PBRMaterial).metadata = {};
								(mesh.material as BABYLON.PBRMaterial).metadata.useEnvMap = true;
								(mesh.material as BABYLON.PBRMaterial).useGLTFLightFalloff = true; // Clustered Lightingではphysical falloffを持つマテリアルはアーチファクトが発生する https://doc.babylonjs.com/features/featuresDeepDive/lights/clusteredLighting/#materials-with-a-physical-falloff-may-cause-artefacts
								(mesh.material as BABYLON.PBRMaterial).anisotropy.isEnabled = false; // なんかきれいにレンダリングされないため
							}
						}

						if (!this.scene.meshes.includes(mesh)) this.scene.addMesh(mesh);
					}
				};
				p.loadAvatar().then(() => {
					this.sr.disableSnapshotRendering();
					this.sr.enableSnapshotRendering();
				});
				this.playerContainers.push(p);
			} else {
				if (states[k] != null) {
					playerContainer.applyState(states[k]);
				}
			}
		}
	}

	public clearPlayers() {
		this.sr.disableSnapshotRendering();
		for (const playerContainer of this.playerContainers) {
			playerContainer.destroy();
		}
		this.sr.enableSnapshotRendering();
		this.playerContainers = [];
	}

	public updateAvatarDisplayOptions(options: { showUsername: boolean; show2dAvatar: boolean }) {
		this.showUsernameOnAvatar = options.showUsername;
		this.show2dAvatarOnAvatar = options.show2dAvatar;

		this.sr.disableSnapshotRendering();
		for (const playerContainer of this.playerContainers) {
			playerContainer.updateUserInfoDisplayOptions(options);
		}
		this.sr.enableSnapshotRendering();
	}

	public destroy() {
		for (const playerContainer of this.playerContainers) {
			playerContainer.destroy();
		}
		super.destroy();
	}
}
