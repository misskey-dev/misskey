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
