/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { cm } from 'misskey-world/src/utility.js';
import { mug_schema } from 'misskey-world/src/room/objects/mug.schema.js';
import { defineAccessory } from '../accessory.js';

export const mug = defineAccessory(mug_schema, {
	createInstance: ({ scene, root, sr }) => {
		const emitter = new BABYLON.TransformNode('emitter', scene);
		emitter.parent = root;
		emitter.position = new BABYLON.Vector3(0, cm(5), 0);
		const ps = new BABYLON.ParticleSystem('steamParticleSystem', 8, scene);
		ps.particleTexture = new BABYLON.Texture('/client-assets/world/avatar-accessories/mug/steam.png');
		ps.emitter = emitter;
		ps.minEmitBox = new BABYLON.Vector3(cm(-1), 0, cm(-1));
		ps.maxEmitBox = new BABYLON.Vector3(cm(1), 0, cm(1));
		ps.minEmitPower = cm(10);
		ps.maxEmitPower = cm(12);
		ps.minLifeTime = 2;
		ps.maxLifeTime = 3;
		ps.addSizeGradient(0, cm(10), cm(12));
		ps.addSizeGradient(1, cm(18), cm(20));
		ps.direction1 = new BABYLON.Vector3(-0.3, 1, 0.3);
		ps.direction2 = new BABYLON.Vector3(0.3, 1, -0.3);
		ps.emitRate = 0.5;
		ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
		ps.color1 = new BABYLON.Color4(1, 1, 1, 0.3);
		ps.color2 = new BABYLON.Color4(1, 1, 1, 0.2);
		ps.colorDead = new BABYLON.Color4(1, 1, 1, 0);
		ps.preWarmCycles = Math.random() * 1000;
		ps.start();
		sr.fixParticleSystem(ps);

		return {
			dispose: () => {
				ps.stop();
				emitter.dispose();
			},
		};
	},
});
