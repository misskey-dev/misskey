/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import type { RoomEngine } from './engine.js';

export function yuge(room: RoomEngine, mesh: BABYLON.Mesh, offset: BABYLON.Vector3) {
	const emitter = new BABYLON.TransformNode('emitter', room.scene);
	emitter.parent = mesh;
	emitter.position = offset;
	const ps = new BABYLON.ParticleSystem('steamParticleSystem', 8, room.scene);
	ps.particleTexture = new BABYLON.Texture('/client-assets/room/steam.png');
	ps.emitter = emitter;
	ps.minEmitBox = new BABYLON.Vector3(-1/*cm*/, 0, -1/*cm*/);
	ps.maxEmitBox = new BABYLON.Vector3(1/*cm*/, 0, 1/*cm*/);
	ps.minEmitPower = 10;
	ps.maxEmitPower = 12;
	ps.minLifeTime = 2;
	ps.maxLifeTime = 3;
	ps.addSizeGradient(0, 10/*cm*/, 12/*cm*/);
	ps.addSizeGradient(1, 18/*cm*/, 20/*cm*/);
	ps.direction1 = new BABYLON.Vector3(-0.3, 1, 0.3);
	ps.direction2 = new BABYLON.Vector3(0.3, 1, -0.3);
	ps.emitRate = 0.5;
	ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
	ps.color1 = new BABYLON.Color4(1, 1, 1, 0.3);
	ps.color2 = new BABYLON.Color4(1, 1, 1, 0.2);
	ps.colorDead = new BABYLON.Color4(1, 1, 1, 0);
	ps.preWarmCycles = Math.random() * 1000;
	ps.start();
}

const _assumedFramesPerSecond = 60;

export class HorizontalCameraKeyboardMoveInput extends BABYLON.BaseCameraPointersInput {
	public camera: BABYLON.FreeCamera;
	private engine: BABYLON.AbstractEngine;
	private scene: BABYLON.Scene;
	moveSpeed = 6 / _assumedFramesPerSecond;
	preShift = false;
	codes = [];
	codesUp = ['KeyW'];
	codesDown = ['KeyS'];
	codesLeft = ['KeyA'];
	codesRight = ['KeyD'];
	onCanvasBlurObserver = null;
	onKeyboardObserver = null;
	public canMove = true;

	constructor(camera: BABYLON.UniversalCamera) {
		super();
		this.camera = camera;
		this.scene = this.camera.getScene();
		this.engine = this.scene.getEngine();
	}

	attachControl() {
		if (this.onCanvasBlurObserver) {
			return;
		}

		this.onCanvasBlurObserver = this.engine.onCanvasBlurObservable.add(() => {
			this.codes = [];
		});

		this.onKeyboardObserver = this.scene.onKeyboardObservable.add(({ event, type }) => {
			const { code, shiftKey } = event;
			this.preShift = shiftKey;

			if (type === BABYLON.KeyboardEventTypes.KEYDOWN) {
				if (this.codesUp.indexOf(code) >= 0 ||
					this.codesDown.indexOf(code) >= 0 ||
					this.codesLeft.indexOf(code) >= 0 ||
					this.codesRight.indexOf(code) >= 0) {
					const index = this.codes.findIndex(v => v.code === code);
					if (index < 0) { // 存在しなかったら追加する
						this.codes.push({ code });
					}
					event.preventDefault();
					(event as KeyboardEvent).stopPropagation();
				}
			} else {
				if (this.codesUp.indexOf(code) >= 0 ||
					this.codesDown.indexOf(code) >= 0 ||
					this.codesLeft.indexOf(code) >= 0 ||
					this.codesRight.indexOf(code) >= 0) {
					const index = this.codes.findIndex(v => v.code === code);
					if (index >= 0) { // 存在したら削除する
						this.codes.splice(index, 1);
					}
					event.preventDefault();
					(event as KeyboardEvent).stopPropagation();
				}
			}
		});
	}

	detachControl() {
		this.codes = [];

		if (this.onKeyboardObserver) this.scene.onKeyboardObservable.remove(this.onKeyboardObserver);
		if (this.onCanvasBlurObserver) this.engine.onCanvasBlurObservable.remove(this.onCanvasBlurObserver);
		this.onKeyboardObserver = null;
		this.onCanvasBlurObserver = null;
	}

	checkInputs() {
		if (!this.onKeyboardObserver) {
			return;
		}
		for (let index = 0; index < this.codes.length; index++) {
			const { code } = this.codes[index];

			const local = new BABYLON.Vector3();
			if (this.codesLeft.indexOf(code) >= 0) {
				local.x += -1;
			} else if (this.codesUp.indexOf(code) >= 0) {
				local.z += this.scene.useRightHandedSystem ? -1 : 1;
			} else if (this.codesRight.indexOf(code) >= 0) {
				local.x += 1;
			} else if (this.codesDown.indexOf(code) >= 0) {
				local.z += this.scene.useRightHandedSystem ? 1 : -1;
			}

			if (local.length() === 0) {
				continue;
			}

			const dir = this.camera.getDirection(local.normalize());
			dir.y = 0;
			dir.normalize();
			const rate = this.preShift ? 3 : 1;
			const move = dir.scale(this.moveSpeed * rate);

			if (this.canMove) {
				this.camera.cameraDirection.addInPlace(move);
			}
		}
	}

	getClassName() {
		return 'HorizontalCameraKeyboardMoveInput';
	}

	getSimpleName() {
		return 'horizontalkeyboard';
	}
}
